import tkinter as tk
from tkinter import ttk, filedialog, scrolledtext, messagebox
import smtplib
import ssl
import os
import mimetypes
import threading
import io
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from email.utils import make_msgid

# --- DEPENDENCY CHECK ---
try:
    import qrcode
    from PIL import Image, ImageDraw, ImageFont, ImageTk
except ImportError:
    import sys
    print("CRITICAL: Missing libraries. Install them or this won't work.")
    print("Run: pip install pillow qrcode")
    sys.exit()

# --- CONFIG DEFAULTS ---
DEFAULT_SENDER = "dsa@kcislk.ntpc.edu.tw"
DEFAULT_PASSWORD = "xcuk qwjw yext eibz" # Hardcoded App Password
DEFAULT_QR_DATA = "VALID ADMISSION 2025" # Placeholder for actual ticket data
DEFAULT_QR_SIZE = "1150"
DEFAULT_QR_POS_X = "220"
DEFAULT_QR_POS_Y = "1110"
DEFAULT_FONT_SIZE = "150"
DEFAULT_NAME_POS_X = "400"
DEFAULT_NAME_POS_Y = "925"

# --- CORE LOGIC ---

def generate_ticket_image(bg_path, qr_data, name_text, qr_pos, name_pos, qr_size, font_size):
    """
    Synthesizes the ticket. Now with THICK outlines.
    """
    if not os.path.exists(bg_path):
        raise FileNotFoundError(f"Background missing: {bg_path}")

    # 1. Load Background
    try:
        img = Image.open(bg_path).convert("RGBA")
    except Exception as e:
        raise Exception(f"Failed to open image: {e}")
    
    # 2. Generate QR
    qr = qrcode.QRCode(box_size=10, border=0)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    
    # High-quality resize
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    # 3. Paste QR
    img.paste(qr_img, qr_pos, qr_img)

    # 4. Draw Name with Outline
    draw = ImageDraw.Draw(img)
    
    try:
        # Try finding a bold font
        font_options = ["arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf", "FreeSansBold.ttf"]
        font = None
        for f_name in font_options:
            try:
                font = ImageFont.truetype(f_name, font_size)
                break
            except IOError:
                continue
        if not font:
            font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    # Stroke logic (Outline)
    stroke_w = int(font_size * 0.05) 
    
    draw.text(
        name_pos, 
        name_text, 
        font=font, 
        fill="black", 
        stroke_width=stroke_w, 
        stroke_fill="white"
    )

    return img

def image_to_bytes(img):
    out = io.BytesIO()
    img.save(out, format='PNG')
    out.seek(0)
    return out.read()

def send_email_thread(log_func, toggle_ui_func, creds, msg_data, ticket_config, attachments):
    sender, password = creds
    receiver, subject, body = msg_data
    bg_path, qr_data, name_text, qr_x, qr_y, name_x, name_y, qr_sz, f_sz = ticket_config

    try:
        log_func("Generating high-res ticket...")
        ticket_img = generate_ticket_image(bg_path, qr_data, name_text, (qr_x, qr_y), (name_x, name_y), qr_sz, f_sz)
        ticket_bytes = image_to_bytes(ticket_img)
        
        # Email Construction
        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = receiver
        msg["Subject"] = subject

        # HTML Body
        img_cid = make_msgid(domain="ticket.local")[1:-1]
        html = f"""
        <html>
            <body>
                <p>{body.replace(chr(10), '<br>')}</p>
                <br>
                <img src="cid:{img_cid}" alt="Ticket" style="max-width:100%; height:auto;">
            </body>
        </html>
        """
        msg.attach(MIMEText(html, "html"))

        # Embed Image
        img_part = MIMEBase("image", "png")
        img_part.set_payload(ticket_bytes)
        encoders.encode_base64(img_part)
        img_part.add_header('Content-ID', f'<{img_cid}>')
        img_part.add_header('Content-Disposition', 'inline', filename='ticket.png')
        msg.attach(img_part)

        # Attachments
        for path in attachments:
            if os.path.isfile(path):
                ctype, _ = mimetypes.guess_type(path)
                if ctype is None: ctype = "application/octet-stream"
                main, sub = ctype.split("/", 1)
                with open(path, "rb") as f:
                    part = MIMEBase(main, sub)
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(path)}")
                msg.attach(part)

        log_func("Connecting to SMTP...")
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(sender, password)
            server.sendmail(sender, receiver.split(","), msg.as_string())
        
        log_func("DONE: Email sent successfully.")

    except Exception as e:
        log_func(f"ERROR: {str(e)}")
    finally:
        toggle_ui_func(True)

# --- GUI CLASS ---

class TicketApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Ticket Blaster v2 // DSA Dept.")
        self.root.geometry("1100x750")
        
        # Theme
        style = ttk.Style()
        style.theme_use('clam')
        
        # State
        self.bg_path = tk.StringVar()
        self.preview_image_ref = None # Keep reference to avoid GC
        self.last_generated_pil = None # Cache for resizing
        self._preview_timer = None # For debouncing auto-preview

        # Layout: PanedWindow for resizable split
        self.paned = ttk.PanedWindow(root, orient=tk.HORIZONTAL)
        self.paned.pack(fill=tk.BOTH, expand=True)

        # LEFT FRAME: Controls (Scrollable)
        self.left_frame_container = ttk.Frame(self.paned, width=400)
        self.paned.add(self.left_frame_container, weight=1)
        
        # Scroll logic for left frame
        self.canvas = tk.Canvas(self.left_frame_container)
        self.scrollbar = ttk.Scrollbar(self.left_frame_container, orient="vertical", command=self.canvas.yview)
        self.scroll_frame = ttk.Frame(self.canvas)
        
        self.scroll_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.create_window((0, 0), window=self.scroll_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")

        # RIGHT FRAME: Preview
        self.right_frame = ttk.Frame(self.paned, width=600, relief="sunken")
        self.paned.add(self.right_frame, weight=3)
        
        # Preview Label
        self.preview_label = ttk.Label(self.right_frame, text="NO PREVIEW\n(Select Background Image to Start)", anchor="center")
        self.preview_label.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Bind resize event to update preview scaling
        self.right_frame.bind("<Configure>", self.on_resize_preview)

        # --- BUILD CONTROLS ---
        self.build_ui()

    def build_ui(self):
        p = 10
        
        # 1. CREDENTIALS
        c_frame = ttk.LabelFrame(self.scroll_frame, text="AUTH (Auto-Filled)", padding=p)
        c_frame.pack(fill="x", padx=p, pady=p)
        
        self.create_entry(c_frame, "Email:", DEFAULT_SENDER, 0)
        self.entry_pass = self.create_entry(c_frame, "App Pass:", DEFAULT_PASSWORD, 1, show="*")

        # 2. CONTENT
        m_frame = ttk.LabelFrame(self.scroll_frame, text="PAYLOAD", padding=p)
        m_frame.pack(fill="x", padx=p, pady=p)
        
        self.entry_to = self.create_entry(m_frame, "Recipient:", "", 0)
        self.entry_sub = self.create_entry(m_frame, "Subject:", "Your Event Ticket", 1)
        
        ttk.Label(m_frame, text="Body:").grid(row=2, column=0, sticky="nw", pady=5)
        self.text_body = scrolledtext.ScrolledText(m_frame, width=30, height=4)
        self.text_body.grid(row=2, column=1, sticky="we")
        self.text_body.insert("1.0", "Here is your ticket. Do not lose it.")

        # 3. TICKET CONFIG
        t_frame = ttk.LabelFrame(self.scroll_frame, text="RENDER CONFIG (Live Preview)", padding=p)
        t_frame.pack(fill="x", padx=p, pady=p)

        # Background
        ttk.Label(t_frame, text="BG Image:").grid(row=0, column=0, sticky="w")
        e_bg = ttk.Entry(t_frame, textvariable=self.bg_path)
        e_bg.grid(row=0, column=1, sticky="we")
        ttk.Button(t_frame, text="..", width=3, command=self.browse_bg).grid(row=0, column=2)

        # QR
        self.entry_qr_data = self.create_entry(t_frame, "QR Data:", DEFAULT_QR_DATA, 1)
        self.entry_qr_size = self.create_entry(t_frame, "QR Size:", DEFAULT_QR_SIZE, 2)
        
        ttk.Label(t_frame, text="QR Pos (X,Y):").grid(row=3, column=0, sticky="w")
        qr_p = ttk.Frame(t_frame)
        qr_p.grid(row=3, column=1, sticky="w")
        self.entry_qr_x = ttk.Entry(qr_p, width=6); self.entry_qr_x.insert(0, DEFAULT_QR_POS_X); self.entry_qr_x.pack(side="left")
        self.entry_qr_x.bind("<KeyRelease>", self.schedule_preview)
        
        self.entry_qr_y = ttk.Entry(qr_p, width=6); self.entry_qr_y.insert(0, DEFAULT_QR_POS_Y); self.entry_qr_y.pack(side="left", padx=5)
        self.entry_qr_y.bind("<KeyRelease>", self.schedule_preview)

        # Name
        self.entry_name = self.create_entry(t_frame, "Name:", "John Doe", 4)
        self.entry_font_sz = self.create_entry(t_frame, "Font Size:", DEFAULT_FONT_SIZE, 5)
        
        ttk.Label(t_frame, text="Name Pos (X,Y):").grid(row=6, column=0, sticky="w")
        nm_p = ttk.Frame(t_frame)
        nm_p.grid(row=6, column=1, sticky="w")
        self.entry_nm_x = ttk.Entry(nm_p, width=6); self.entry_nm_x.insert(0, DEFAULT_NAME_POS_X); self.entry_nm_x.pack(side="left")
        self.entry_nm_x.bind("<KeyRelease>", self.schedule_preview)
        
        self.entry_nm_y = ttk.Entry(nm_p, width=6); self.entry_nm_y.insert(0, DEFAULT_NAME_POS_Y); self.entry_nm_y.pack(side="left", padx=5)
        self.entry_nm_y.bind("<KeyRelease>", self.schedule_preview)

        # 4. ACTIONS
        a_frame = ttk.Frame(self.scroll_frame, padding=p)
        a_frame.pack(fill="x", padx=p, pady=p)
        
        # Removed "Refresh" button since it's auto now, but kept as fallback
        ttk.Button(a_frame, text="FORCE REFRESH", command=self.run_preview).pack(fill="x", pady=5)
        self.btn_send = ttk.Button(a_frame, text="SEND EMAIL", command=self.run_send)
        self.btn_send.pack(fill="x", pady=5)
        
        self.lbl_status = ttk.Label(a_frame, text="Ready", foreground="grey")
        self.lbl_status.pack()

    def create_entry(self, parent, label, default, row, show=None):
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w", pady=2)
        entry = ttk.Entry(parent, show=show)
        entry.insert(0, default)
        entry.grid(row=row, column=1, sticky="we", pady=2)
        parent.columnconfigure(1, weight=1) # Fluid input
        
        # Bind for auto-preview
        entry.bind("<KeyRelease>", self.schedule_preview)
        return entry

    def browse_bg(self):
        f = filedialog.askopenfilename(filetypes=[("Images", "*.png *.jpg *.jpeg")])
        if f: 
            self.bg_path.set(f)
            self.run_preview()

    def log(self, msg):
        self.lbl_status.config(text=msg)
        self.root.update_idletasks()

    def toggle_ui(self, enable):
        state = tk.NORMAL if enable else tk.DISABLED
        self.btn_send.config(state=state)

    # --- AUTO-PREVIEW LOGIC ---
    def schedule_preview(self, event=None):
        """Debounce the preview generation (wait 500ms after last keypress)"""
        if self._preview_timer:
            self.root.after_cancel(self._preview_timer)
        self._preview_timer = self.root.after(500, self.run_preview)

    def run_preview(self):
        """Generates the image and stores it in self.last_generated_pil"""
        try:
            # self.log("Rendering preview...") 
            # Commented out log to avoid spamming UI during typing
            
            # Gather inputs
            bg = self.bg_path.get()
            if not bg: 
                self.log("Waiting for background image...")
                return

            qr_d = self.entry_qr_data.get()
            nm = self.entry_name.get()
            
            # Safer int conversion for live editing
            try:
                qx_str, qy_str = self.entry_qr_x.get(), self.entry_qr_y.get()
                qs_str = self.entry_qr_size.get()
                nx_str, ny_str = self.entry_nm_x.get(), self.entry_nm_y.get()
                fs_str = self.entry_font_sz.get()
                
                # If fields are empty (user deleting), just abort silently
                if not all([qx_str, qy_str, qs_str, nx_str, ny_str, fs_str]):
                    return

                qx, qy = int(qx_str), int(qy_str)
                qs = int(qs_str)
                nx, ny = int(nx_str), int(ny_str)
                fs = int(fs_str)
            except ValueError:
                # User typed a letter or something, ignore
                return

            # Generate
            self.last_generated_pil = generate_ticket_image(bg, qr_d, nm, (qx, qy), (nx, ny), qs, fs)
            self.update_preview_display()
            self.lbl_status.config(text="Preview updated.")

        except Exception as e:
            self.log(f"Preview Error: {e}")
            print(e)

    def on_resize_preview(self, event):
        """Called when the window is resized. Re-scales the existing image."""
        if self.last_generated_pil:
            self.update_preview_display()

    def update_preview_display(self):
        if not self.last_generated_pil: return

        # Calculate scale to fit right frame
        disp_w = self.right_frame.winfo_width()
        disp_h = self.right_frame.winfo_height()
        
        if disp_w < 10 or disp_h < 10: return # Too small

        img_w, img_h = self.last_generated_pil.size
        ratio = min(disp_w / img_w, disp_h / img_h)
        
        new_size = (int(img_w * ratio), int(img_h * ratio))
        
        # Fast resize for preview
        resized = self.last_generated_pil.resize(new_size, Image.Resampling.BILINEAR)
        
        self.preview_image_ref = ImageTk.PhotoImage(resized)
        self.preview_label.config(image=self.preview_image_ref, text="")

    # --- SEND LOGIC ---
    def run_send(self):
        bg = self.bg_path.get()
        if not bg:
            self.log("Select background first.")
            return
            
        self.toggle_ui(False)
        
        creds = (DEFAULT_SENDER, self.entry_pass.get())
        msg_data = (self.entry_to.get(), self.entry_sub.get(), self.text_body.get("1.0", "end-1c"))
        
        try:
             ticket_conf = (
                bg,
                self.entry_qr_data.get(),
                self.entry_name.get(),
                int(self.entry_qr_x.get()), int(self.entry_qr_y.get()),
                int(self.entry_nm_x.get()), int(self.entry_nm_y.get()),
                int(self.entry_qr_size.get()), int(self.entry_font_sz.get())
            )
        except ValueError:
            self.log("Invalid numbers in config.")
            self.toggle_ui(True)
            return

        threading.Thread(
            target=send_email_thread, 
            args=(self.log, self.toggle_ui, creds, msg_data, ticket_conf, []), 
            daemon=True
        ).start()

if __name__ == "__main__":
    root = tk.Tk()
    app = TicketApp(root)
    root.mainloop()
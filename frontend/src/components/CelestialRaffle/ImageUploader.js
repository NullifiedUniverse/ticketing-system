import React, { useState, useRef } from 'react';
import { uploadPrizeImage } from '../../services/api';

const ImageUploader = ({ onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const filename = await uploadPrizeImage(file);
            setUploading(false);
            setPreview(null);
            fileInputRef.current.value = ""; // Reset
            if (onUploadComplete) onUploadComplete(filename);
            alert("Image Uploaded Successfully!");
        } catch (err) {
            console.error("Upload Error Details:", err);
            // Check for HTML response (often indicates 404/500 from web server)
            if (err.message && err.message.includes("non-JSON")) {
                alert("Upload Failed: Server returned an error (likely 404 Not Found or 500 Internal Error). Please ensure the backend is running and you have restarted it to apply the new routes.");
            } else {
                alert("Upload Failed: " + err.message);
            }
            setUploading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upload Prize Image</h3>
            <div className="flex gap-4 items-start">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    className="hidden" 
                    id="prize-image-upload"
                />
                <label 
                    htmlFor="prize-image-upload" 
                    className="cursor-pointer w-24 h-24 bg-slate-900 border border-slate-600 border-dashed rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors"
                >
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <span className="text-2xl text-slate-500">+</span>
                    )}
                </label>
                
                <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-500">Select an image to use as the "Meteor" for the next prize.</p>
                    <button 
                        onClick={handleUpload}
                        disabled={!preview || uploading}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
                    >
                        {uploading ? 'Uploading...' : 'Upload & Queue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageUploader;

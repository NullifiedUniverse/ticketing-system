import { useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const useModal = () => {
    const [modalContent, setModalContent] = useState(null);
    const { t } = useLanguage();

    const showModal = useCallback((content) => {
        setModalContent(content);
    }, []);

    const hideModal = useCallback(() => {
        setModalContent(null);
    }, []);

    const showErrorModal = useCallback((message) => {
        showModal({ type: 'alert', title: t('modalError'), body: message });
    }, [showModal, t]);

    const showConfirmModal = useCallback((title, body, onConfirm) => {
        showModal({ type: 'confirm', title, body, onConfirm });
    }, [showModal]);
    
    const showPromptModal = useCallback((title, body, onConfirm) => {
        showModal({ type: 'prompt', title, body, onConfirm });
    }, [showModal]);

    const showQrCodeModal = useCallback((title, body, qrValue) => {
        showModal({ type: 'qr-code', title, body, qrValue });
    }, [showModal]);

    return { modalContent, showModal, hideModal, showErrorModal, showConfirmModal, showPromptModal, showQrCodeModal };
};

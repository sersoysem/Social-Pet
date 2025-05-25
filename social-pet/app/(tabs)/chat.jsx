import { sendLocalNotification } from '../../config/NotificationConfig';

const onSend = async (newMessages = []) => {
    // ... existing message sending code ...
    
    // Karşı tarafa bildirim gönder
    if (otherEmail) {
        try {
            await sendLocalNotification(
                localUser.name,
                messageToSave.text,
                { 
                    type: 'message',
                    chatId: chatId
                }
            );
            console.log('Mesaj bildirimi gönderildi');
        } catch (error) {
            console.log('Mesaj bildirimi gönderilemedi:', error);
        }
    }
}; 
import { sendLocalNotification } from '../config/NotificationConfig';

export const sendChatNotification = async (localUser, messageToSave, otherEmail, chatId) => {
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
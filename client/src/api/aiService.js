import api from "./axios";

const aiService = {
    /**
     * Chat with the AI Health Assistant.
     * @param {string} message - User's message
     * @param {Array} history - Conversation history [{role: 'user'|'assistant', content: '...'}]
     * @returns {Promise<string>} AI response message
     */
    chatWithAssistant: async (message, history = []) => {
        const response = await api.post("/patient/ai/chat", {
            message,
            history,
        });
        return response.data.data.message;
    },

    /**
     * Suggest doctors based on symptoms.
     * @param {string} symptoms - Description of symptoms
     * @returns {Promise<{specializations: string[], explanation: string}>}
     */
    suggestDoctors: async (symptoms) => {
        const response = await api.post("/patient/ai/suggest-doctors", {
            symptoms,
        });
        return response.data.data;
    },
};

export default aiService;

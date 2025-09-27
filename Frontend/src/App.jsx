import React, { useState, useEffect } from 'react';
import axios from 'axios';

// The backend API URL
const API_URL = 'http://localhost:8000';

// A simple loading spinner component
const Spinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

function App() {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);

    // Fetch emails from the backend when the component mounts
    useEffect(() => {
        const fetchEmails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/emails`);
                setEmails(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch emails. Is the backend server running?');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);

    // Group emails by their label
    const groupedEmails = emails.reduce((acc, email) => {
        const label = email.label || 'uncategorized';
        if (!acc[label]) {
            acc[label] = [];
        }
        acc[label].push(email);
        return acc;
    }, {});
    
    // Handle actions like 'archive' or 'delete'
    const handleAction = async (messageId, action) => {
        try {
            await axios.post(`${API_URL}/emails/${messageId}/action`, { action });
            // Remove the email from the list visually
            setEmails(emails.filter(e => e.id !== messageId));
        } catch (error) {
            console.error(`Failed to ${action} email:`, error);
            alert(`Could not ${action} the email.`);
        }
    };
    
    // Handle feedback (when user corrects a classification)
    const handleFeedback = async (messageId, correctLabel) => {
        try {
            await axios.post(`${API_URL}/feedback`, { correct_label: correctLabel });
             // Visually move the email to the new category
            const emailToMove = emails.find(e => e.id === messageId);
            if(emailToMove){
                emailToMove.label = correctLabel;
                setEmails([...emails]);
            }
            alert(`Feedback sent! Model will learn from this.`);
        } catch (error) {
            console.error('Failed to send feedback:', error);
        }
    };


    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-3xl font-bold text-gray-800">🚀 Personal Email Agent</h1>
                    <p className="text-gray-600">Your inbox, automatically sorted.</p>
                </div>
            </header>

            <main className="container mx-auto p-6">
                {loading && <Spinner />}
                {error && <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
                
                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.keys(groupedEmails).map(category => (
                            <div 
                                key={category}
                                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                            >
                                <h2 className="text-2xl font-bold text-gray-700 capitalize">{category}</h2>
                                <p className="text-5xl font-extrabold text-blue-500 mt-2">{groupedEmails[category].length}</p>
                                <p className="text-gray-500 mt-1">new emails</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeCategory && groupedEmails[activeCategory] && (
                    <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4 capitalize">Emails in "{activeCategory}"</h3>
                        <ul className="space-y-4">
                            {groupedEmails[activeCategory].map(email => (
                                <li key={email.id} className="border p-4 rounded-lg hover:bg-gray-50">
                                    <p className="font-bold text-gray-700">{email.sender}</p>
                                    <p className="text-gray-800 font-semibold">{email.subject}</p>
                                    <p className="text-gray-600 text-sm">{email.snippet}</p>
                                    <div className="mt-3 flex items-center space-x-2">
                                        <button onClick={() => handleAction(email.id, 'archive')} className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full hover:bg-green-600">Archive</button>
                                        <button onClick={() => handleAction(email.id, 'delete')} className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-full hover:bg-red-600">Delete</button>
                                        <div className="relative inline-block text-left">
                                            <select
                                              onChange={(e) => handleFeedback(email.id, e.target.value)}
                                              className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 appearance-none"
                                            >
                                                <option value="">Move to...</option>
                                                {Object.keys(groupedEmails).filter(c => c !== activeCategory).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
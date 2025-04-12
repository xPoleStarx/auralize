import React, { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // localStorage'dan API anahtarını al
    const savedKey = localStorage.getItem('openai_api_key') || '';
    setApiKey(savedKey);
  }, [isOpen]);

  const handleSave = () => {
    try {
      if (apiKey.trim() === '') {
        setError('API anahtarı boş olamaz.');
        return;
      }
      
      // API anahtarını localStorage'a kaydet
      localStorage.setItem('openai_api_key', apiKey.trim());
      setSaved(true);
      setError('');
      
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (err) {
      setError('API anahtarı kaydedilirken bir hata oluştu.');
    }
  };

  const handleClear = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setSaved(true);
    setError('');
    
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Ayarlar</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span aria-hidden="true">❌</span>
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            OpenAI API Anahtarı
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="sk-..."
          />
          <div className="flex items-start mt-2 text-sm text-gray-600">
            <span className="mr-1 mt-0.5 flex-shrink-0">ℹ️</span>
            <p>API anahtarınız yerel olarak tarayıcınızda saklanır ve hiçbir sunucuya gönderilmez.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Ayarlar başarıyla kaydedildi!
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            API Anahtarını Temizle
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
          >
            <span className="mr-2">💾</span>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 
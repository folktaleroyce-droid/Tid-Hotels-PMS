import React, { useState, useEffect } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';

export const Settings: React.FC = () => {
    const { taxSettings, setTaxSettings } = useHotelData();
    const [localSettings, setLocalSettings] = useState(taxSettings);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setLocalSettings(taxSettings);
    }, [taxSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setLocalSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
        }));
    };
    
    const handleSave = () => {
        setTaxSettings(localSettings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card title="Application Settings">
                <div className="space-y-8">
                    {/* Tax Settings Section */}
                    <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Tax Configuration</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="tax-enabled" className="font-medium">Enable Automatic Tax Calculation</label>
                                <div className="relative">
                                    <input
                                        id="tax-enabled"
                                        type="checkbox"
                                        name="isEnabled"
                                        className="sr-only"
                                        checked={localSettings.isEnabled}
                                        onChange={handleInputChange}
                                    />
                                    <div className={`block ${localSettings.isEnabled ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-600'} w-12 h-6 rounded-full`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.isEnabled ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                            </div>

                            {localSettings.isEnabled && (
                                <div>
                                    <label htmlFor="tax-rate" className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        id="tax-rate"
                                        name="rate"
                                        value={localSettings.rate}
                                        onChange={handleInputChange}
                                        step="0.1"
                                        min="0"
                                        className="w-full max-w-xs p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Save Button */}
                    <div className="flex justify-end items-center space-x-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                         {isSaved && (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                                Settings saved successfully!
                            </span>
                        )}
                        <Button onClick={handleSave}>
                            Save Settings
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
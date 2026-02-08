
import React, { useState, useMemo } from 'react';
import { useHotelData } from '../hooks/useHotelData.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { CateringAsset, Event } from '../types.ts';

export const CateringAssetBoard: React.FC<{ hotelData: any }> = ({ hotelData }) => {
  const { cateringAssets, events, addCateringAsset, addEvent, updateCateringAsset } = hotelData;
  const [activeTab, setActiveTab] = useState<'inventory' | 'events'>('inventory');
  
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  const [assetForm, setAssetForm] = useState<Partial<CateringAsset>>({ condition: 'Excellent', quantityTotal: 0 });
  const [eventForm, setEventForm] = useState<Partial<Event>>({ status: 'Confirmed', assetsAssigned: [] });

  const handleSaveAsset = () => {
    if (!assetForm.name || !assetForm.quantityTotal) return;
    addCateringAsset({ ...assetForm, quantityAvailable: assetForm.quantityTotal } as any);
    setIsAssetModalOpen(false);
    setAssetForm({ condition: 'Excellent', quantityTotal: 0 });
  };

  const handleSaveEvent = () => {
    if (!eventForm.clientName || !eventForm.date) return;
    
    // Check asset availability
    const exceeds = eventForm.assetsAssigned?.some(aa => {
        const asset = cateringAssets.find((a: any) => a.id === aa.assetId);
        return asset && aa.quantity > asset.quantityAvailable;
    });

    if (exceeds) {
        alert("Operation Aborted: Insufficient Asset Volume for Request");
        return;
    }

    addEvent(eventForm as any);
    
    // Deduct from availability
    eventForm.assetsAssigned?.forEach(aa => {
        const asset = cateringAssets.find((a: any) => a.id === aa.assetId);
        if (asset) {
            updateCateringAsset({ ...asset, quantityAvailable: asset.quantityAvailable - aa.quantity });
        }
    });

    setIsEventModalOpen(false);
    setEventForm({ status: 'Confirmed', assetsAssigned: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Resource Allocation</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">Catering & Event Infrastructure Hub</p>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-300 dark:border-slate-700">
          <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Operational Equipment</button>
          <button onClick={() => setActiveTab('events')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'events' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Event Manifest</button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsAssetModalOpen(true)}>Register Resource</Button>
          </div>
          <Card title="Authoritative Equipment Registry">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                  <tr>
                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Infrastructure Item</th>
                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Available Volume</th>
                    <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-center">Protocol condition</th>
                    <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cateringAssets.map((asset: CateringAsset) => (
                    <tr key={asset.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                      <td className="p-3 font-black text-xs uppercase text-slate-900 dark:text-white">{asset.name}</td>
                      <td className="p-3">
                        <span className="font-mono font-black text-lg text-indigo-600">{asset.quantityAvailable}</span>
                        <span className="text-[10px] text-slate-400 font-bold ml-1 tracking-tighter uppercase">/ {asset.quantityTotal} Global</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${asset.condition === 'Excellent' ? 'bg-green-100 text-green-700' : (asset.condition === 'Poor' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-indigo-600 text-[10px] font-black uppercase hover:underline">Log Damage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsEventModalOpen(true)}>Initialize Event Session</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length > 0 ? events.map((event: Event) => (
              <Card key={event.id} className="border-l-4 border-indigo-600 group hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-black uppercase text-slate-900 dark:text-white leading-tight">{event.clientName}</h4>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Timeline: {event.date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${event.status === 'Completed' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>{event.status}</span>
                </div>
                <div className="space-y-2 mt-6">
                  <p className="text-[9px] font-black uppercase text-indigo-500 border-b border-indigo-50 pb-1 tracking-tighter">Allocated Infrastructure</p>
                  {event.assetsAssigned.map(aa => {
                    const asset = cateringAssets.find((a: any) => a.id === aa.assetId);
                    return (
                      <div key={aa.assetId} className="flex justify-between text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                        <span>{asset?.name}</span>
                        <span className="font-mono text-indigo-600">x{aa.quantity}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex gap-2">
                    <Button size="sm" variant="secondary" className="w-full text-[9px] font-black uppercase">Finalize</Button>
                    <button className="text-[9px] font-black uppercase text-red-500 px-2">Void</button>
                </div>
              </Card>
            )) : (
              <div className="col-span-full py-40 text-center opacity-30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Event Registry Cycle Inactive</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Asset Modal */}
      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title="Operational Resource Enrollment">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Asset Nomenclature</label>
            <input type="text" value={assetForm.name || ''} onChange={e => setAssetForm({...assetForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg font-black uppercase text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Total Unit Capacity</label>
                <input type="number" value={assetForm.quantityTotal || 0} onChange={e => setAssetForm({...assetForm, quantityTotal: parseInt(e.target.value)})} className="w-full p-2.5 border rounded-lg font-mono font-black text-lg" />
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Designated condition</label>
                <select value={assetForm.condition} onChange={e => setAssetForm({...assetForm, condition: e.target.value as any})} className="w-full p-2.5 border rounded-lg font-black uppercase text-xs">
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor (Requires Main.)</option>
                </select>
             </div>
          </div>
          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAssetModalOpen(false)}>Abort Enrollment</Button>
            <Button onClick={handleSaveAsset}>Commit Resource</Button>
          </div>
        </div>
      </Modal>

      {/* Event Modal */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Event Logistics Integration">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Client Entity Name</label>
            <input type="text" value={eventForm.clientName || ''} onChange={e => setEventForm({...eventForm, clientName: e.target.value})} className="w-full p-2.5 border rounded-lg font-black uppercase text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Deployment Timeline (Date)</label>
            <input type="date" value={eventForm.date || ''} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full p-2.5 border rounded-lg font-bold text-xs" />
          </div>
          
          <div className="space-y-2">
            <h5 className="text-[10px] font-black uppercase text-indigo-500 mb-2 tracking-widest">Asset Allocation Matrix</h5>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {cateringAssets.map((asset: any) => {
                    const existing = eventForm.assetsAssigned?.find(aa => aa.assetId === asset.id);
                    return (
                        <div key={asset.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-600">{asset.name} (Avl: {asset.quantityAvailable})</span>
                            <input 
                                type="number" 
                                placeholder="Qty" 
                                min="0" 
                                max={asset.quantityAvailable}
                                value={existing?.quantity || ''}
                                onChange={e => {
                                    const qty = parseInt(e.target.value) || 0;
                                    const others = eventForm.assetsAssigned?.filter(aa => aa.assetId !== asset.id) || [];
                                    setEventForm({ ...eventForm, assetsAssigned: qty > 0 ? [...others, { assetId: asset.id, quantity: qty }] : others });
                                }}
                                className="w-16 p-1 text-center font-mono font-black text-[10px] border rounded"
                            />
                        </div>
                    );
                })}
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsEventModalOpen(false)}>Discard Manifest</Button>
            <Button onClick={handleSaveEvent}>Authorize Deployment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

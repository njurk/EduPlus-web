import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import type { Classroom } from '../../types';
import { Edit2, Trash2, Plus } from 'lucide-react';

const initialData: Classroom[] = [
  { id: 1, name: 'Sala 101 (Chemia)', isActive: true, createdAt: '', updatedAt: '' },
  { id: 2, name: 'Sala 202 (Informatyka)', isActive: true, createdAt: '', updatedAt: '' },
  { id: 3, name: 'Sala Gimnastyczna', isActive: false, createdAt: '', updatedAt: '' },
];

export const Classrooms = () => {
  const [data, setData] = useState<Classroom[]>(initialData);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Classroom>>({});

  const handleDelete = (id: number) => {
    if (confirm('Czy na pewno dezaktywować?')) {
      setData(prev => prev.map(item => item.id === id ? { ...item, isActive: false } : item));
    }
  };

  const handleSave = () => {
    if (isEditing === 0) {
      const newId = Math.max(...data.map(d => d.id)) + 1;
      setData([...data, { ...editForm, id: newId, isActive: true } as Classroom]);
    } else {
      setData(prev => prev.map(item => item.id === isEditing ? { ...item, ...editForm } as Classroom : item));
    }
    setIsEditing(null);
    setEditForm({});
  };

  return (
    <div className="bg-white border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="font-bold text-gray-700 uppercase tracking-wide text-sm">Sale Lekcyjne</h2>
        <Button onClick={() => { setIsEditing(0); setEditForm({}); }}>
          <Plus size={16} className="mr-2 inline" /> Nowa sala
        </Button>
      </div>

      {isEditing !== null && (
        <div className="p-4 bg-green-50 border-b border-green-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Nazwa sali</label>
            <Input
              value={editForm.name || ''}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Zapisz</Button>
            <Button variant="secondary" onClick={() => setIsEditing(null)}>Anuluj</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200 bg-gray-50 uppercase">
              <th className="px-4 py-3 font-semibold w-16">ID</th>
              <th className="px-4 py-3 font-semibold">Nazwa</th>
              <th className="px-4 py-3 font-semibold w-32 text-center">Status</th>
              <th className="px-4 py-3 font-semibold w-32 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 group">
                <td className="px-4 py-2 text-gray-500">#{item.id}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-2 text-center"><Badge active={item.isActive} /></td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setIsEditing(item.id); setEditForm(item); }}
                      className="p-1 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
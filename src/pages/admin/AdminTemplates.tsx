import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, X } from 'lucide-react';
import { getContractTemplates, updateContractTemplate } from '../../lib/api';
import type { ContractTemplate } from '../../types';

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await getContractTemplates();
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: ContractTemplate) => {
    setEditingId(template.id);
    setEditContent(template.content);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await updateContractTemplate(id, editContent);
      await loadTemplates();
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getTemplateLabel = (template: ContractTemplate) => {
    const type = template.template_type === 'individual' ? 'Fizičko lice' : 'Pravno lice';
    const pkg = template.package_type === 'pius-plus' ? 'PIUS PLUS' : 'PIUS PRO';
    return `${pkg} - ${type}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pius" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4">Template ugovora</h2>
        <p className="text-gray-400 text-sm mb-6">
          Uredite sadržaj ugovora za različite tipove paketa i lica. Koristite placeholder-e kao što su
          {' '}<code className="bg-gray-800 px-1 rounded">{'{ime}'}</code>,
          {' '}<code className="bg-gray-800 px-1 rounded">{'{prezime}'}</code>,
          {' '}<code className="bg-gray-800 px-1 rounded">{'{email}'}</code>, itd.
        </p>
      </div>

      {templates.map((template) => (
        <div key={template.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">{getTemplateLabel(template)}</h3>
              <p className="text-sm text-gray-400">
                Zadnja izmjena: {new Date(template.updated_at).toLocaleDateString('sr-RS')}
              </p>
            </div>
            {editingId === template.id ? (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Odustani
                </button>
                <button
                  onClick={() => handleSave(template.id)}
                  disabled={saving}
                  className="px-3 py-1 bg-pius text-black rounded-lg hover:bg-pius-dark flex items-center disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Spremanje...' : 'Spremi'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEdit(template)}
                className="px-3 py-1 border border-pius text-pius rounded-lg hover:bg-pius/10 flex items-center"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Uredi
              </button>
            )}
          </div>
          <div className="p-6">
            {editingId === template.id ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-96 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm resize-none focus:ring-2 focus:ring-pius"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono max-h-64 overflow-y-auto bg-gray-800 p-4 rounded-lg">
                {template.content}
              </pre>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

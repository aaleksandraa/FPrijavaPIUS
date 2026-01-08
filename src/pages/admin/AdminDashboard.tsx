import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Euro, TrendingUp } from 'lucide-react';
import { getDashboardStats } from '../../lib/api';

interface Stats {
  total_students: number;
  signed_contracts: number;
  by_status: {
    enrolled: number;
    contract_signed: number;
    completed: number;
  };
  by_package: {
    pius_plus: number;
    pius_pro: number;
  };
  revenue: {
    pius_plus: number;
    pius_pro: number;
    total: number;
  };
  recent_students: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pius" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { icon: Users, label: 'Ukupno studenata', value: stats.total_students, color: 'text-blue-400' },
    { icon: FileText, label: 'Potpisanih ugovora', value: stats.signed_contracts, color: 'text-green-400' },
    { icon: Euro, label: 'Ukupni prihod', value: `${stats.revenue.total.toLocaleString()}€`, color: 'text-pius' },
    { icon: TrendingUp, label: 'PIUS PRO', value: stats.by_package.pius_pro, color: 'text-purple-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
            <div className="text-sm text-gray-400">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Status studenata</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Upisani</span>
              <span className="text-white font-semibold">{stats.by_status.enrolled}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ugovor potpisan</span>
              <span className="text-pius font-semibold">{stats.by_status.contract_signed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Završeni</span>
              <span className="text-green-400 font-semibold">{stats.by_status.completed}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Prihod po paketu</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">PIUS PLUS ({stats.by_package.pius_plus})</span>
              <span className="text-white font-semibold">{stats.revenue.pius_plus.toLocaleString()}€</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">PIUS PRO ({stats.by_package.pius_pro})</span>
              <span className="text-pius font-semibold">{stats.revenue.pius_pro.toLocaleString()}€</span>
            </div>
            <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
              <span className="text-white font-semibold">UKUPNO</span>
              <span className="text-2xl font-bold text-pius">{stats.revenue.total.toLocaleString()}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Nedavne registracije</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm">
                <th className="pb-3">Student</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Paket</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats.recent_students.map((student: any) => (
                <tr key={student.id}>
                  <td className="py-3 text-white">{student.first_name} {student.last_name}</td>
                  <td className="py-3 text-gray-400">{student.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      student.package_type === 'pius-pro' ? 'bg-purple-900/50 text-purple-300' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {student.package_type === 'pius-plus' ? 'PLUS' : 'PRO'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      student.status === 'contract_signed' ? 'bg-pius/20 text-pius' :
                      student.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {student.status === 'enrolled' ? 'Upisan' :
                       student.status === 'contract_signed' ? 'Potpisan' : 'Završen'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

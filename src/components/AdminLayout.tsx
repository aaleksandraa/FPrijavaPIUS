import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Users, FileText, Settings, LogOut, LayoutDashboard, Package, Receipt, Layout } from 'lucide-react';
import { getMe, logout } from '../lib/api';
import type { AdminUser } from '../types';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pius_admin_token');
    if (!token) {
      navigate('/?admin=true');
      return;
    }

    getMe()
      .then(res => setAdmin(res.data))
      .catch(() => {
        localStorage.removeItem('pius_admin_token');
        navigate('/?admin=true');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    localStorage.removeItem('pius_admin_token');
    localStorage.removeItem('pius_admin_session');
    navigate('/?admin=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pius" />
      </div>
    );
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/students', icon: Users, label: 'Studenti' },
    { path: '/admin/contracts', icon: FileText, label: 'Ugovori' },
    { path: '/admin/invoices', icon: Receipt, label: 'Fakture' },
    { path: '/admin/packages', icon: Package, label: 'Kursevi' },
    { path: '/admin/landing-pages', icon: Layout, label: 'Stranice' },
    { path: '/admin/templates', icon: Settings, label: 'Template' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-poppins">
      {/* Header */}
      <div className="bg-gray-900 border-b border-pius/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold">
              <span className="text-pius">PIUS</span> Admin Panel
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                <div>Prijavljen kao:</div>
                <div className="text-pius font-medium">{admin?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-400 hover:text-pius transition-colors"
                title="Odjavite se"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  location.pathname === item.path
                    ? 'border-pius text-pius'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}

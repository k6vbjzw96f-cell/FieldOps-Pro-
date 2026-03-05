import React, { useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = ({ title, onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6" data-testid="header">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          onClick={onMenuClick}
          data-testid="mobile-menu-btn"
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>
        <h1 className="text-2xl font-semibold text-slate-900 font-[Manrope]">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search tasks, team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-slate-50 border-slate-200"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="notification-badge">3</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
            </div>
            <DropdownMenuItem className="p-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-900">New task assigned</p>
                <p className="text-xs text-slate-500">HVAC repair at 123 Main St</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-900">Low stock alert</p>
                <p className="text-xs text-slate-500">Air filters running low (5 remaining)</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-900">Task completed</p>
                <p className="text-xs text-slate-500">John completed plumbing repair</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;

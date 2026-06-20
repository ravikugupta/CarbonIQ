import React from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, LayoutDashboard, Calculator, Lightbulb, Target } from 'lucide-react';

export default function Navbar() {
  const navLinks = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/calculator", icon: <Calculator size={20} />, label: "Calculator" },
    { to: "/insights", icon: <Lightbulb size={20} />, label: "Insights" },
    { to: "/actions", icon: <Target size={20} />, label: "Actions" },
  ];

  return (
    <nav className="bg-[#0f1915] border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 text-primaryGreen font-bold text-xl">
            <Leaf />
            <span>CarbonIQ</span>
          </div>
          <div className="flex space-x-4">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-primaryGreen text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {link.icon}
                <span className="hidden sm:inline">{link.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

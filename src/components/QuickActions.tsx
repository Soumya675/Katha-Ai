import React from 'react';
import { Mail, Calendar, Bell, FileText, Search, CloudSun, MessageSquare, Sparkles } from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (promptText: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction }) => {
  const quickPrompts = [
    {
      label: 'Email (Odia-English Test)',
      icon: Mail,
      category: 'Voice-to-Action',
      prompt: 'Kal Rahul ku mail kari kahiba ki project review 3 PM re achhi.',
      description: 'Drafts email to Rahul with 3 PM review and asks for permission',
    },
    {
      label: 'Message (Odia Action)',
      icon: MessageSquare,
      category: 'Voice-to-Action',
      prompt: 'Rahul ku message kari kahiba meeting 3 PM re achhi.',
      description: 'Prepares message notification for Rahul in Odia context',
    },
    {
      label: 'Calendar Event',
      icon: Calendar,
      category: 'Productivity',
      prompt: 'Schedule project review meeting tomorrow at 10 AM with core team',
      description: 'Creates calendar appointment with time and attendees',
    },
    {
      label: 'Weather (Bhubaneswar)',
      icon: CloudSun,
      category: 'Information',
      prompt: 'Bhubaneswar re aaji mausam kemiti achhi?',
      description: 'Queries live meteorological data in Odia / English',
    },
    {
      label: 'RAG Document Search',
      icon: FileText,
      category: 'Knowledge Base',
      prompt: 'What is the data security and PII policy in our guidelines documentation?',
      description: 'Scans uploaded company manuals with exact source citations',
    },
    {
      label: 'Smart Reminder',
      icon: Bell,
      category: 'Memory',
      prompt: 'Set a reminder to check model evaluation metrics and training loss in 2 hours',
      description: 'Registers notification alarm in user task queue',
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick Actions & Multilingual Triggers
          </h3>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Tap to test voice-to-action
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {quickPrompts.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectAction(item.prompt)}
              className="group flex flex-col items-start p-3.5 rounded-xl border border-slate-800 bg-[#0d121c]/70 hover:bg-[#121927] hover:border-slate-700 transition-all text-left focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <div className="flex items-center gap-2 w-full mb-1.5">
                <div className="p-1.5 rounded-lg bg-slate-800/80 text-amber-400 group-hover:bg-amber-500/10 group-hover:text-amber-300 transition-colors">
                  <IconComponent className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  {item.label}
                </span>
                <span className="ml-auto text-[10px] text-slate-500 font-mono">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 italic group-hover:text-slate-300">
                "{item.prompt}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

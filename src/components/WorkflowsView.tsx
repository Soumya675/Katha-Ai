import React, { useState } from 'react';
import { Mail, Calendar, Bell, CheckSquare, CloudSun, Search, ArrowRight, ShieldAlert, CheckCircle2, History } from 'lucide-react';
import { ToolExecutionResult } from '../types/index.ts';

export const WorkflowsView: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('send_email');
  const [formData, setFormData] = useState<Record<string, string>>({
    recipient: 'Rahul',
    subject: 'Project Review Update',
    message: 'The project review is scheduled for 3 PM tomorrow.',
  });
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ToolExecutionResult | null>(null);

  const toolsList = [
    {
      id: 'send_email',
      name: 'Email Dispatcher',
      isSensitive: true,
      icon: Mail,
      desc: 'Composes and sends verified emails with preview and user authorization.',
      fields: [
        { key: 'recipient', label: 'Recipient Name or Email', placeholder: 'Rahul / team@katha-ai.in' },
        { key: 'subject', label: 'Email Subject', placeholder: 'Project Review' },
        { key: 'message', label: 'Message Body', placeholder: 'Meeting is scheduled for 3 PM tomorrow.' },
      ],
    },
    {
      id: 'send_message',
      name: 'Message Sender',
      isSensitive: true,
      icon: Mail,
      desc: 'Sends high priority direct communication alerts to Indian contacts.',
      fields: [
        { key: 'recipient', label: 'Contact', placeholder: 'Rahul' },
        { key: 'message', label: 'Message Text', placeholder: 'Meeting 3 PM re achhi.' },
      ],
    },
    {
      id: 'create_calendar_event',
      name: 'Calendar Scheduler',
      isSensitive: true,
      icon: Calendar,
      desc: 'Books meeting rooms and appointments on Google Calendar / Outlook.',
      fields: [
        { key: 'title', label: 'Event Title', placeholder: 'AI Architecture Review' },
        { key: 'date', label: 'Date', placeholder: 'Tomorrow' },
        { key: 'time', label: 'Time', placeholder: '15:00 IST' },
        { key: 'duration', label: 'Duration', placeholder: '45 mins' },
      ],
    },
    {
      id: 'create_reminder',
      name: 'Smart Reminder',
      isSensitive: true,
      icon: Bell,
      desc: 'Registers timed alarm reminders with conversational context.',
      fields: [
        { key: 'task', label: 'Reminder Task', placeholder: 'Check training loss and WER reports' },
        { key: 'time', label: 'Trigger Time', placeholder: 'in 2 hours' },
      ],
    },
    {
      id: 'create_task',
      name: 'Task Manager',
      isSensitive: false,
      icon: CheckSquare,
      desc: 'Adds prioritized work items to team productivity queue.',
      fields: [
        { key: 'task', label: 'Task Description', placeholder: 'Inspect Silero VAD latency logs' },
        { key: 'priority', label: 'Priority', placeholder: 'high' },
      ],
    },
    {
      id: 'get_weather',
      name: 'Meteorological Service',
      isSensitive: false,
      icon: CloudSun,
      desc: 'Fetches real-time weather and temperature for Indian cities.',
      fields: [
        { key: 'location', label: 'City or Region', placeholder: 'Bhubaneswar' },
      ],
    },
    {
      id: 'search_web',
      name: 'Web Intelligence Search',
      isSensitive: false,
      icon: Search,
      desc: 'Conducts grounded web searches with snippet extraction.',
      fields: [
        { key: 'query', label: 'Search Query', placeholder: 'Odisha Digital Mission 2026' },
      ],
    },
  ];

  const currentToolDef = toolsList.find((t) => t.id === selectedTool)!;

  const handleToolChange = (toolId: string) => {
    setSelectedTool(toolId);
    setLastResult(null);
    const newTool = toolsList.find((t) => t.id === toolId)!;
    const initial: Record<string, string> = {};
    newTool.fields.forEach((f) => {
      initial[f.key] = f.placeholder.split('/')[0].trim();
    });
    setFormData(initial);
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: selectedTool,
          arguments: formData,
        }),
      });
      const data = await res.json();
      setLastResult(data);
    } catch (err) {
      console.error('Execution error:', err);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Katha Agent Tools & Workflow Automation
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore registered agent tools, permission safety boundaries, and manual execution testing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool selector list */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Tool Catalog ({toolsList.length})
          </h3>
          {toolsList.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolChange(tool.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-[#0e1422] text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{tool.name}</span>
                    {tool.isSensitive && (
                      <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Auth Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {tool.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Execution & parameter form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{currentToolDef.name}</span>
                  <span className="font-mono text-xs text-slate-400">({currentToolDef.id})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentToolDef.desc}</p>
              </div>
              {currentToolDef.isSensitive ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Sensitive: Permission Enforced</span>
                </div>
              ) : (
                <span className="text-xs text-emerald-400 font-mono">Safe: Auto-Authorized</span>
              )}
            </div>

            <div className="space-y-3">
              {currentToolDef.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              ))}

              <div className="pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Schema verified by ToolPermissionManager
                </span>
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-50"
                >
                  <span>{executing ? 'Executing...' : 'Trigger Action Test'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Execution Result Card */}
          {lastResult && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">
                    Execution Successful · Receipt Recorded
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(lastResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-200 mb-3">{lastResult.message}</p>
              <div className="rounded-xl bg-slate-950/80 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
                <pre>{JSON.stringify(lastResult.output, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

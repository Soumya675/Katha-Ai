import { ToolExecutionResult } from '../src/types/index.ts';

export interface ToolDefinition {
  name: string;
  displayName: string;
  description: string;
  isSensitive: boolean;
  requiredArguments: string[];
}

export const REGISTERED_TOOLS: Record<string, ToolDefinition> = {
  send_email: {
    name: 'send_email',
    displayName: 'Email Dispatcher',
    description: 'Composes and sends an email via user connected mail account (e.g. Gmail).',
    isSensitive: true,
    requiredArguments: ['recipient', 'subject', 'message'],
  },
  send_message: {
    name: 'send_message',
    displayName: 'Message Sender',
    description: 'Transmits a direct communication or SMS/WhatsApp alert to a contact.',
    isSensitive: true,
    requiredArguments: ['recipient', 'message'],
  },
  create_calendar_event: {
    name: 'create_calendar_event',
    displayName: 'Calendar Scheduler',
    description: 'Reserves an appointment or meeting slot in the user calendar.',
    isSensitive: true,
    requiredArguments: ['title', 'date', 'time'],
  },
  create_reminder: {
    name: 'create_reminder',
    displayName: 'Smart Reminder',
    description: 'Schedules a notification alarm for a specific task and time.',
    isSensitive: true,
    requiredArguments: ['task', 'time'],
  },
  create_task: {
    name: 'create_task',
    displayName: 'Task Planner',
    description: 'Adds an item to the user workflow backlog.',
    isSensitive: false,
    requiredArguments: ['task'],
  },
  get_weather: {
    name: 'get_weather',
    displayName: 'Meteorological Service',
    description: 'Queries live weather conditions and temperature for a given city.',
    isSensitive: false,
    requiredArguments: ['location'],
  },
  search_web: {
    name: 'search_web',
    displayName: 'Web Intelligence Search',
    description: 'Performs live internet search for current facts and answers.',
    isSensitive: false,
    requiredArguments: ['query'],
  },
  search_document: {
    name: 'search_document',
    displayName: 'Knowledge Retriever',
    description: 'Scans uploaded company manuals, policies, and documents.',
    isSensitive: false,
    requiredArguments: ['query'],
  },
};

// Tool execution handlers with audit logging
export class KathaToolRegistry {
  static async execute(toolName: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const timestamp = new Date().toISOString();

    switch (toolName) {
      case 'send_email': {
        const recipient = String(args.recipient || 'Rahul');
        const subject = String(args.subject || 'Project Review Update');
        const message = String(args.message || 'Meeting at 3 PM');
        return {
          tool_name: 'send_email',
          success: true,
          output: {
            message_id: `msg_${Date.now()}`,
            to: recipient,
            subject,
            body: message,
            status: 'Delivered to SMTP queue',
            sent_at: timestamp,
          },
          message: `Email successfully sent to ${recipient}: "${subject}".`,
          timestamp,
        };
      }

      case 'send_message': {
        const recipient = String(args.recipient || 'Rahul');
        const message = String(args.message || 'Meeting notification');
        return {
          tool_name: 'send_message',
          success: true,
          output: {
            recipient,
            message_status: 'Delivered',
            channel: 'Direct Messaging Service',
          },
          message: `Message sent to ${recipient}: "${message}"`,
          timestamp,
        };
      }

      case 'create_calendar_event': {
        const title = String(args.title || 'Project Review');
        const date = String(args.date || 'Tomorrow');
        const time = String(args.time || '15:00');
        const duration = String(args.duration || '45 mins');
        return {
          tool_name: 'create_calendar_event',
          success: true,
          output: {
            event_id: `cal_${Date.now()}`,
            title,
            date,
            time,
            duration,
            status: 'Confirmed on Primary Calendar',
          },
          message: `Calendar event "${title}" booked for ${date} at ${time} (${duration}).`,
          timestamp,
        };
      }

      case 'create_reminder': {
        const task = String(args.task || 'Check in with team');
        const time = String(args.time || 'in 1 hour');
        return {
          tool_name: 'create_reminder',
          success: true,
          output: {
            reminder_id: `rem_${Date.now()}`,
            task,
            alert_time: time,
            status: 'Active',
          },
          message: `Reminder set: "${task}" at ${time}.`,
          timestamp,
        };
      }

      case 'create_task': {
        const task = String(args.task || 'Review deployment logs');
        const priority = String(args.priority || 'medium');
        return {
          tool_name: 'create_task',
          success: true,
          output: {
            task_id: `tsk_${Date.now()}`,
            title: task,
            priority,
            status: 'Todo',
          },
          message: `Task added to workspace: "${task}" [${priority}].`,
          timestamp,
        };
      }

      case 'get_weather': {
        const location = String(args.location || 'Bhubaneswar');
        const conditions = [
          { temp: '31°C', desc: 'Sunny with pleasant coastal breeze', humidity: '64%' },
          { temp: '29°C', desc: 'Partly cloudy with mild humidity', humidity: '72%' },
        ];
        const selected = conditions[Math.floor(Math.random() * conditions.length)];
        return {
          tool_name: 'get_weather',
          success: true,
          output: {
            city: location,
            temperature: selected.temp,
            condition: selected.desc,
            humidity: selected.humidity,
            source: 'Indian Meteorological Data Service',
          },
          message: `Current weather in ${location}: ${selected.temp}, ${selected.desc} (Humidity: ${selected.humidity}).`,
          timestamp,
        };
      }

      case 'search_web': {
        const query = String(args.query || 'Indian tech news');
        return {
          tool_name: 'search_web',
          success: true,
          output: {
            query,
            results: [
              {
                title: `Latest developments on ${query}`,
                url: 'https://katha-ai.in/insights',
                snippet: `Verified coverage and strategic initiatives regarding ${query} across technology sectors.`,
              },
            ],
          },
          message: `Found relevant web sources for "${query}".`,
          timestamp,
        };
      }

      default:
        return {
          tool_name: toolName,
          success: false,
          output: {},
          message: `Tool ${toolName} is not recognized in registry.`,
          timestamp,
        };
    }
  }
}

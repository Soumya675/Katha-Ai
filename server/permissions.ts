import { ToolCallProposal } from '../src/types/index.ts';
import { REGISTERED_TOOLS } from './tools.ts';

// In-memory proposal audit store
const proposalsMap: Map<string, ToolCallProposal> = new Map();

export class ToolPermissionManager {
  static createProposal(toolName: string, args: Record<string, unknown>): ToolCallProposal {
    const toolDef = REGISTERED_TOOLS[toolName];
    const isSensitive = toolDef ? toolDef.isSensitive : true;
    const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let previewText = `Action proposed: ${toolName}`;
    if (toolName === 'send_email') {
      previewText = `I have drafted this email for ${args.recipient || 'the recipient'}:\nSubject: ${args.subject || 'Meeting Notice'}\nMessage: "${args.message || ''}"`;
    } else if (toolName === 'send_message') {
      previewText = `I have prepared this message for ${args.recipient || 'the contact'}: "${args.message || ''}"`;
    } else if (toolName === 'create_calendar_event') {
      previewText = `Schedule event "${args.title || 'Meeting'}" on ${args.date || 'tomorrow'} at ${args.time || '15:00'}?`;
    } else if (toolName === 'create_reminder') {
      previewText = `Set an alarm reminder for "${args.task || 'task'}" at ${args.time || 'specified time'}?`;
    }

    const proposal: ToolCallProposal = {
      id,
      tool_name: toolName,
      description: toolDef ? toolDef.description : 'Automated action execution',
      arguments: args,
      is_sensitive: isSensitive,
      permission_status: isSensitive ? 'pending' : 'approved',
      preview_text: previewText,
    };

    proposalsMap.set(id, proposal);
    return proposal;
  }

  static getProposal(id: string): ToolCallProposal | undefined {
    return proposalsMap.get(id);
  }

  static updateStatus(id: string, status: ToolCallProposal['permission_status'], updatedArgs?: Record<string, unknown>): ToolCallProposal | null {
    const proposal = proposalsMap.get(id);
    if (!proposal) return null;

    proposal.permission_status = status;
    if (updatedArgs) {
      proposal.arguments = { ...proposal.arguments, ...updatedArgs };
    }
    return proposal;
  }
}

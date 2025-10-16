import { RoleDialogueTemplate, DialogueRoleId } from '../../../game/narrative/dialogueTone/roleTemplateTypes';
import { MERCHANT_ROLE_TEMPLATES } from './merchant';
import { CHECKPOINT_GUARD_TEMPLATES } from './checkpointGuard';
import { STREET_DOC_TEMPLATES } from './streetDoc';
import { GANG_SCOUT_TEMPLATES } from './gangScout';
import { SAFEHOUSE_HANDLER_TEMPLATES } from './safehouseHandler';

const ROLE_TEMPLATES: RoleDialogueTemplate[] = [
  ...MERCHANT_ROLE_TEMPLATES,
  ...CHECKPOINT_GUARD_TEMPLATES,
  ...STREET_DOC_TEMPLATES,
  ...GANG_SCOUT_TEMPLATES,
  ...SAFEHOUSE_HANDLER_TEMPLATES,
];

export const ROLE_TEMPLATE_REGISTRY: Record<DialogueRoleId, RoleDialogueTemplate[]> =
  ROLE_TEMPLATES.reduce((accumulator, template) => {
    if (!accumulator[template.roleId]) {
      accumulator[template.roleId] = [];
    }
    accumulator[template.roleId].push(template);
    return accumulator;
  }, {} as Record<DialogueRoleId, RoleDialogueTemplate[]>);

export const listAllRoleDialogueTemplates = (): RoleDialogueTemplate[] => ROLE_TEMPLATES.slice();

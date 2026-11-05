// Client (GUI) half of the text-stats plugin: registers a dedicated left-menu
// navigation entry in the Settings panel and renders the harness-native,
// schema-driven settings form for the host plugin's configuration namespace
// ('test-stats').
//
// The form reuses the shared ConfigForm the settings subsystem projects from
// the host plugin's Cordis Config schema, so no field controls are hand-rolled:
// fields, types, validation and revision-safe writes all come from the schema.
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import {
  SettingsForm,
  SettingsValueField,
  SettingsFormModel,
  type SettingsFieldSpec,
  type SettingsFieldState,
  type SettingsFormActions,
  type SettingsFormLabels,
  type SettingsFormScope,
  type SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  InjectFace,
  PropsRuntime,
} from '@deepseek-ai/dsh-client-ui-slots'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'

/** Host plugin entry id; the settings namespace the form edits. */
const NS = 'test-stats'

/** Configuration shape mirrored from the host plugin's Config schema. */
interface TextStatsForm {
  countLines?: boolean
  wordSplitMode?: 'whitespace' | 'cjk'
  outputLanguage?: 'en' | 'zh'
}

/** One boolean field, edited as the text 'true' / 'false'. */
function booleanField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => (value === true ? 'true' : value === false ? 'false' : ''),
    parse: (text) => {
      const trimmed = text.trim()
      if (trimmed === '') return { kind: 'clear' }
      if (trimmed === 'true') return { kind: 'set', value: true }
      if (trimmed === 'false') return { kind: 'set', value: false }
      return undefined
    },
  }
}

/** One of the string-valued enum fields, edited as its literal text. */
function enumField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => (typeof value === 'string' ? value : ''),
    parse: (text) => {
      const trimmed = text.trim()
      if (trimmed === '') return { kind: 'clear' }
      return { kind: 'set', value: trimmed }
    },
  }
}

/** What the section renders: the shared shell state plus one entry per field. */
interface TextStatsFormState extends SettingsFormShell {
  countLines: SettingsFieldState
  wordSplitMode: SettingsFieldState
  outputLanguage: SettingsFieldState
}

/** The registration-side face injected into the section component. */
interface TextStatsFace extends SettingsFormActions {
  hooks: { textStats: SnapshotStore<TextStatsFormState> }
}

/** Bridges the shared ConfigForm onto a staged, save-on-demand form. */
class TextStatsController {
  private readonly model: SettingsFormModel<TextStatsForm>

  constructor(scope: SettingsFormScope<TextStatsForm>) {
    this.model = new SettingsFormModel<TextStatsForm>(scope, [
      booleanField('countLines'),
      enumField('wordSplitMode'),
      enumField('outputLanguage'),
    ])
  }

  inject(): TextStatsFace {
    return {
      hooks: { textStats: this.model.bind(() => this.project()) },
      ...this.model.actions(),
    }
  }

  private project(): TextStatsFormState {
    return {
      ...this.model.shell(),
      countLines: this.model.field('countLines'),
      wordSplitMode: this.model.field('wordSplitMode'),
      outputLanguage: this.model.field('outputLanguage'),
    }
  }

  dispose(): void {
    this.model.dispose()
  }
}

/** Props the renderer binds: the section's runtime (incl. close) plus the injected face. */
export type TextStatsSettingsSectionProps =
  PropsRuntime<'settings.section'>
  & InjectFace<TextStatsFace>

const FORM_LABELS: SettingsFormLabels = {
  unavailable: 'This setting is not available in the current deployment.',
  readOnly: 'Settings are read-only in this deployment.',
  saveFailed: 'The last save was not accepted. Adjust and try again.',
  save: 'Save',
  saving: 'Saving',
}

/**
 * Render the text-stats configuration form.
 * @param props - section runtime props, the injected form face, and the bound store hook.
 * @returns the settings form, or the unavailable line while the Host serves no namespace.
 */
export function TextStatsSettingsSection(props: TextStatsSettingsSectionProps) {
  const state = props.useTextStats(snapshot => snapshot)
  const countLines = props.useTextStats(snapshot => snapshot.countLines)
  const wordSplitMode = props.useTextStats(snapshot => snapshot.wordSplitMode)
  const outputLanguage = props.useTextStats(snapshot => snapshot.outputLanguage)
  const disabled = !state.writable
  return (
    <SettingsForm labels={FORM_LABELS} state={state} onSave={props.save} onDiscard={props.discard}>
      <SettingsValueField
        id="text-stats-count-lines"
        label="Count lines"
        hint="Also report the number of lines in the text."
        overriddenLabel="Overridden"
        resetLabel="Reset"
        invalidLabel="Enter true or false."
        disabled={disabled}
        {...countLines}
        onEdit={(text) => { props.edit('countLines', text) }}
        onReset={() => { props.resetField('countLines') }}
      />
      <SettingsValueField
        id="text-stats-word-split-mode"
        label="Word split mode"
        hint="whitespace: split on spaces. cjk: also count each CJK character as a word."
        overriddenLabel="Overridden"
        resetLabel="Reset"
        invalidLabel="Enter whitespace or cjk."
        disabled={disabled}
        {...wordSplitMode}
        onEdit={(text) => { props.edit('wordSplitMode', text) }}
        onReset={() => { props.resetField('wordSplitMode') }}
      />
      <SettingsValueField
        id="text-stats-output-language"
        label="Output language"
        hint="en: English summary. zh: Chinese summary."
        overriddenLabel="Overridden"
        resetLabel="Reset"
        invalidLabel="Enter en or zh."
        disabled={disabled}
        {...outputLanguage}
        onEdit={(text) => { props.edit('outputLanguage', text) }}
        onReset={() => { props.resetField('outputLanguage') }}
      />
    </SettingsForm>
  )
}

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'configForms']

/**
 * Register the text-stats settings section while the Host serves the namespace.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const controller = new TextStatsController(ctx.configForms.get(NS))
  ctx.effect(() => () => { controller.dispose() }, 'text-stats: form subscription')
  ctx.effect(() => ctx.configForms.whileServed([NS], () => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'text-stats-config',
    order: 50,
    label: () => 'Text Stats',
    inject: () => controller.inject(),
  }, TextStatsSettingsSection))), 'text-stats: settings page')
}

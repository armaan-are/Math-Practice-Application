import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { DifficultySelector } from '../components/setup/DifficultySelector';
import { OperationSelector } from '../components/setup/OperationSelector';
import { SessionLengthSelector } from '../components/setup/SessionLengthSelector';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import {
  clearAllApplicationData,
  loadSettings,
  saveSettings,
} from '../services/storageService';
import type { AppSettings } from '../types';

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [message, setMessage] = useState('');

  const update = <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const save = () => {
    const result = saveSettings(settings);
    setMessage(
      result.ok ? 'Settings saved.' : 'Settings could not be saved on this device.',
    );
  };

  const clear = () => {
    if (
      !window.confirm(
        'Clear ALL Math Quest data? This removes settings and every practice result.',
      )
    )
      return;
    clearAllApplicationData();
    saveSettings(DEFAULT_SETTINGS);
    navigate('/', { replace: true });
  };

  return (
    <PageContainer>
      <section className="settings-page" aria-labelledby="settings-title">
        <div className="page-heading">
          <p className="eyebrow">Settings</p>
          <h1 id="settings-title">Make Math Quest yours</h1>
        </div>
        <fieldset className="setup-group toggle-list">
          <legend>Practice experience</legend>
          <Toggle
            label="Sound effects"
            checked={settings.soundEffects}
            onChange={(value) => update('soundEffects', value)}
          />
          <Toggle
            label="Card animations"
            checked={settings.cardAnimations}
            onChange={(value) => update('cardAnimations', value)}
          />
          <Toggle
            label="Show explanations"
            checked={settings.showExplanations}
            onChange={(value) => update('showExplanations', value)}
          />
          <Toggle
            label="Positive feedback"
            checked={settings.positiveFeedback}
            onChange={(value) => update('positiveFeedback', value)}
          />
        </fieldset>
        <OperationSelector
          selected={settings.defaultOperations}
          onChange={(value) => update('defaultOperations', value)}
        />
        <DifficultySelector
          selected={settings.defaultDifficulty}
          onChange={(value) => update('defaultDifficulty', value)}
        />
        <SessionLengthSelector
          selected={settings.defaultSessionLength}
          onChange={(value) => update('defaultSessionLength', value)}
        />
        <label className="number-setting">
          <span>Correct review answers needed for mastery</span>
          <input
            type="number"
            min="1"
            max="10"
            defaultValue={settings.masteryThreshold}
            onChange={(event) => {
              if (event.target.value === '') return;
              update(
                'masteryThreshold',
                Math.min(10, Math.max(1, Number(event.target.value))),
              );
            }}
          />
        </label>
        {message && <p role="status">{message}</p>}
        <div className="button-row">
          <button className="button button--primary" onClick={save} type="button">
            Save settings
          </button>
          <button className="button button--supportive" onClick={clear} type="button">
            Clear all application data
          </button>
        </div>
      </section>
    </PageContainer>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

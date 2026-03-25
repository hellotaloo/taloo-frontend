'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Smartphone,
  FileText,
  Phone,
  MessageCircle,
  Zap,
  Calendar,
  Globe,
  Volume2,
  RotateCcw,
  UserRound,
  Upload,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  initiateOutboundScreening,
  isValidPhoneNumber,
  formatPhoneNumber,
  getScreeningErrorMessage,
  submitCVApplication,
  type ScreeningChannel,
  type CVFormData,
} from '@/lib/screening-api';
import { getApplyPopupPreview, type ApplyPopupRendered } from '@/lib/interview-api';

type Step = 'choose' | 'phone-form' | 'call-prep' | 'cv-form';
type Channel = 'phone' | 'whatsapp';

/**
 * Lightweight inline markdown renderer for popup copy.
 * Supports **bold** and [link text](url) — nothing else.
 */
function InlineMarkdown({ text, className }: { text: string; className?: string }) {
  // Split on bold (**...**) and link ([text](url)) patterns
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Find the next markdown pattern
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    // Pick whichever comes first
    const boldIdx = boldMatch?.index ?? Infinity;
    const linkIdx = linkMatch?.index ?? Infinity;

    if (boldIdx === Infinity && linkIdx === Infinity) {
      // No more patterns
      parts.push(remaining);
      break;
    }

    if (boldIdx <= linkIdx && boldMatch) {
      // Bold comes first
      if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx));
      parts.push(
        <span key={key++} className="font-semibold text-gray-900">
          {boldMatch[1]}
        </span>
      );
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (linkMatch && linkIdx !== undefined) {
      // Link comes first
      if (linkIdx > 0) parts.push(remaining.slice(0, linkIdx));
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-gray-900 hover:text-gray-700"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkIdx + linkMatch[0].length);
    }
  }

  return <span className={className}>{parts}</span>;
}

export interface SolliciteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyTitle: string;
  hasWhatsApp: boolean;
  hasVoice: boolean;
  hasCv: boolean;
  /** Name of the virtual assistant. Defaults to 'Anna'. */
  personaName?: string;
  /** Source identifier. Defaults to 'test' for dashboard usage. */
  source?: string;
  /** If provided, called instead of the API when "Laat Anna bellen" is clicked (for demo/playground use) */
  onStartCall?: () => void;
  /** Called on successful submission */
  onSuccess?: (result: { method: 'email' | 'whatsapp' | 'phone'; applicationId?: string }) => void;
}

// Random Dutch names for testing in development
const DUTCH_FIRST_NAMES = ['Jan', 'Pieter', 'Koen', 'Daan', 'Luuk', 'Bram', 'Lars', 'Sven', 'Thijs', 'Ruben', 'Eva', 'Lotte', 'Fleur', 'Sanne', 'Femke'];
const DUTCH_LAST_NAMES = ['de Jong', 'Jansen', 'de Vries', 'Bakker', 'Visser', 'Smit', 'Mulder', 'de Boer', 'Peters', 'Hendriks'];

function getRandomName() {
  const firstName = DUTCH_FIRST_NAMES[Math.floor(Math.random() * DUTCH_FIRST_NAMES.length)];
  const lastName = DUTCH_LAST_NAMES[Math.floor(Math.random() * DUTCH_LAST_NAMES.length)];
  return { firstName, lastName };
}

/** Convenience alias for the rendered content shape */
type PopupContent = ApplyPopupRendered['rendered'];

export function SolliciteerDialog({
  open,
  onOpenChange,
  vacancyId,
  hasWhatsApp,
  hasVoice,
  hasCv,
  personaName = 'Anna',
  source = 'test',
  onStartCall,
  onSuccess,
}: SolliciteerDialogProps) {
  const isTest = source === 'test';
  const isLocal = process.env.NODE_ENV === 'development';
  const hasPhoneOption = hasWhatsApp || hasVoice;
  const hasBothChannels = hasWhatsApp && hasVoice;
  const hasBothOptions = hasCv && hasPhoneOption;

  // Determine initial step: skip choose if only one option
  const initialStep: Step = hasBothOptions ? 'choose' : hasPhoneOption ? 'phone-form' : 'cv-form';
  const defaultChannel: Channel = hasVoice ? 'phone' : 'whatsapp';

  const [step, setStep] = useState<Step>(initialStep);

  // Popup content from API (YAML-driven copy)
  const [popupContent, setPopupContent] = useState<PopupContent | null>(null);
  const contentFetchedRef = useRef(false);

  useEffect(() => {
    if (open && !contentFetchedRef.current) {
      contentFetchedRef.current = true;
      getApplyPopupPreview()
        .then((data) => setPopupContent(data.rendered))
        .catch(() => {}); // silently fall back to hardcoded strings
    }
    if (!open) {
      // Allow re-fetch next time dialog opens (content may have changed)
      contentFetchedRef.current = false;
    }
  }, [open]);

  // Phone flow fields
  const [randomName] = useState(() => getRandomName());
  const [firstName, setFirstName] = useState(isLocal ? randomName.firstName : '');
  const [lastName, setLastName] = useState(isLocal ? randomName.lastName : '');
  const [phoneValue, setPhoneValue] = useState(isLocal ? '+32 487441391' : '');
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // CV flow fields
  const [cvFirstName, setCvFirstName] = useState('');
  const [cvLastName, setCvLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [isSubmittingCv, setIsSubmittingCv] = useState(false);

  // Privacy consent
  const [privacyConsent, setPrivacyConsent] = useState(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      // Reset all state when closing
      setStep(initialStep);
      setPhoneError(null);
      setCvError(null);

      setIsSubmittingCv(false);
      if (isLocal) {
        const newName = getRandomName();
        setFirstName(newName.firstName);
        setLastName(newName.lastName);
        setPhoneValue('+32 487441391');
      } else {
        setFirstName('');
        setLastName('');
        setPhoneValue('');
      }
      setChannel(defaultChannel);
      setCvFirstName('');
      setCvLastName('');
      setEmail('');
      setCvFile(null);
      setPrivacyConsent(false);
    }
  }

  // Phone submit: show call-prep immediately, fire API in background
  function handlePhoneSubmit() {
    setPhoneError(null);

    const formattedPhone = formatPhoneNumber(phoneValue);
    if (!isValidPhoneNumber(formattedPhone)) {
      setPhoneError('Ongeldig telefoonnummer. Gebruik internationaal formaat (bijv. +32471234567).');
      return;
    }

    // Show call-prep / WhatsApp confirmation immediately
    const apiChannel: ScreeningChannel = channel === 'whatsapp' ? 'whatsapp' : 'voice';

    if (apiChannel === 'voice') {
      setStep('call-prep');
    } else {
      toast.success('WhatsApp bericht verzonden!');
      onSuccess?.({ method: 'whatsapp' });
      handleOpenChange(false);
    }

    // Demo/playground override — skip API
    if (onStartCall) {
      onStartCall();
      return;
    }

    // Fire API call in background
    initiateOutboundScreening({
      vacancy_id: vacancyId,
      channel: apiChannel,
      phone_number: formattedPhone,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      is_test: isTest,
    }).catch((err) => {
      const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis';
      toast.error(getScreeningErrorMessage(errorMessage));
    });
  }

  // CV submit
  async function handleCvSubmit() {
    if (!cvFile) {
      setCvError('Selecteer eerst een CV bestand.');
      return;
    }

    setCvError(null);
    setIsSubmittingCv(true);

    try {
      const formData: CVFormData = {
        file: cvFile,
        firstName: cvFirstName,
        lastName: cvLastName,
        email,
      };

      await submitCVApplication(vacancyId, formData);
      toast.success('Je sollicitatie is ontvangen!');
      onSuccess?.({ method: 'email' });
      handleOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis bij het verwerken van je CV.';
      setCvError(errorMessage);
    } finally {
      setIsSubmittingCv(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden gap-0 rounded-2xl border-0 [&>button]:z-10 [&>button]:bg-white/90 [&>button]:rounded-full [&>button]:w-8 [&>button]:h-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:right-3 [&>button]:top-3"
        style={{ '--tw-enter-translate-x': '0', '--tw-enter-translate-y': '0', '--tw-exit-translate-x': '0', '--tw-exit-translate-y': '0' } as React.CSSProperties}
      >
        <DialogDescription className="sr-only">
          Kies hoe je wilt solliciteren
        </DialogDescription>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px] min-h-[520px]">
          {/* Left: Content */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            {step === 'choose' && (
              <ChooseStep
                personaName={personaName}
                content={popupContent?.choice_screen}
                onSelectPhone={() => setStep('phone-form')}
                onSelectCv={() => setStep('cv-form')}
              />
            )}
            {step === 'phone-form' && (
              <PhoneFormStep
                personaName={personaName}
                content={popupContent?.phone_form}
                firstName={firstName}
                lastName={lastName}
                phoneValue={phoneValue}
                channel={channel}
                showChannelToggle={hasBothChannels}
                phoneError={phoneError}
                privacyConsent={privacyConsent}
                onPrivacyConsentChange={setPrivacyConsent}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onPhoneChange={(val) => { setPhoneValue(val); setPhoneError(null); }}
                onChannelChange={setChannel}
                onSubmit={handlePhoneSubmit}
                onSwitchToCv={hasCv ? () => setStep('cv-form') : undefined}
                onBack={hasBothOptions ? () => setStep('choose') : undefined}
              />
            )}
            {step === 'cv-form' && (
              <CvFormStep
                personaName={personaName}
                content={popupContent?.cv_form}
                firstName={cvFirstName}
                lastName={cvLastName}
                email={email}
                cvFile={cvFile}
                cvError={cvError}
                isSubmitting={isSubmittingCv}
                privacyConsent={privacyConsent}
                onPrivacyConsentChange={setPrivacyConsent}
                onFirstNameChange={setCvFirstName}
                onLastNameChange={setCvLastName}
                onEmailChange={setEmail}
                onCvFileChange={setCvFile}
                onSubmit={handleCvSubmit}
                onSwitchToAnna={hasPhoneOption ? () => setStep('phone-form') : undefined}
                onBack={hasBothOptions ? () => setStep('choose') : undefined}
              />
            )}
            {step === 'call-prep' && <CallPrepStep personaName={personaName} />}
          </div>

          {/* Right: Image */}
          <div className="hidden md:block relative w-[380px] min-w-[380px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Step 1: Choose ─── */

function ChooseStep({ personaName, content, onSelectPhone, onSelectCv }: {
  personaName: string;
  content?: PopupContent['choice_screen'];
  onSelectPhone: () => void;
  onSelectCv: () => void;
}) {
  const c = content;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <span className="font-medium">{c?.subtitle ?? `Solliciteer sneller met ${personaName}, je digitale assistent`}</span>
      </div>

      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        {c?.title ?? 'Hoe wil je solliciteren?'}
      </DialogTitle>

      <p className="text-gray-600 text-base leading-relaxed">
        {c?.description ? (
          <InlineMarkdown text={c.description} />
        ) : (
          <>Sneller: laat je nummer achter en {personaName}, onze digitale assistent, belt je{' '}
          <span className="font-semibold text-gray-900">meteen</span> op. Daarna
          kan je binnen <span className="font-semibold text-gray-900">3 dagen</span>{' '}
          met een recruiter spreken.</>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div
          onClick={onSelectPhone}
          className="relative flex flex-col rounded-xl border-2 border-gray-900 bg-gray-50/50 p-5 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5"
        >
          <span className="absolute -top-2.5 right-4 bg-brand-lime-green text-gray-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
            {c?.anna_option?.badge ?? 'Aanrader'}
          </span>
          <span className="font-semibold text-gray-900 mt-1">{c?.anna_option?.title ?? `Sneller met ${personaName}`}</span>
          <p className="text-sm text-gray-600 leading-relaxed mt-1.5 flex-1">
            {c?.anna_option?.description ?? `${personaName} belt je meteen op voor een kort gesprek.`}
          </p>
          <div className="mt-4 bg-gray-900 text-white w-full h-9 text-sm font-medium rounded-md flex items-center justify-center pointer-events-none">
            {c?.anna_option?.button ?? `Solliciteer met ${personaName}`}
          </div>
        </div>

        <div
          onClick={onSelectCv}
          className="relative flex flex-col rounded-xl border-2 border-gray-200 p-5 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5"
        >
          <span className="font-semibold text-gray-900">{c?.cv_option?.title ?? 'Klassiek met cv'}</span>
          <p className="text-sm text-gray-600 leading-relaxed mt-1.5 flex-1">
            {c?.cv_option?.description ?? 'Upload je cv en solliciteer zoals je gewend bent.'}
          </p>
          <div className="mt-4 w-full h-9 text-sm font-medium rounded-md border border-gray-300 flex items-center justify-center pointer-events-none">
            {c?.cv_option?.button ?? 'Solliciteer met cv'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2a: Phone Form ─── */

interface PhoneFormStepProps {
  personaName: string;
  content?: PopupContent['phone_form'];
  firstName: string;
  lastName: string;
  phoneValue: string;
  channel: Channel;
  showChannelToggle: boolean;
  phoneError: string | null;
  privacyConsent: boolean;
  onPrivacyConsentChange: (val: boolean) => void;
  onFirstNameChange: (val: string) => void;
  onLastNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onChannelChange: (val: Channel) => void;
  onSubmit: () => void;
  onSwitchToCv?: () => void;
  onBack?: () => void;
}

function PhoneFormStep({
  personaName,
  content: c,
  firstName,
  lastName,
  phoneValue,
  channel,
  showChannelToggle,
  phoneError,
  privacyConsent,
  onPrivacyConsentChange,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onChannelChange,
  onSubmit,
  onSwitchToCv,
  onBack,
}: PhoneFormStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
          <Smartphone className="w-3 h-3 text-white" />
        </div>
        <span className="font-medium">{c?.subtitle ?? `Sneller solliciteren met ${personaName}, je digitale assistent`}</span>
      </div>

      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        {c?.title ?? 'Laat je gegevens achter'}
      </DialogTitle>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone-firstname" className="text-sm font-medium text-gray-700">
              Voornaam
            </Label>
            <Input
              id="phone-firstname"
              placeholder="Voornaam"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone-lastname" className="text-sm font-medium text-gray-700">
              Achternaam
            </Label>
            <Input
              id="phone-lastname"
              placeholder="Achternaam"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone-number" className="text-sm font-medium text-gray-700">
            Gsm-nummer
          </Label>
          <Input
            id="phone-number"
            type="tel"
            placeholder="+32 4xx xx xx xx"
            value={phoneValue}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={cn('h-11', phoneError && 'border-red-300')}
          />
          {phoneError && (
            <p className="text-sm text-red-600">{phoneError}</p>
          )}
        </div>

        {showChannelToggle && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {c?.contact_label ?? `Hoe wil je dat ${personaName} je bereikt?`}
            </Label>
            <div className="flex rounded-lg bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => onChannelChange('phone')}
                className={cn(
                  'flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer',
                  channel === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Phone className="w-4 h-4" />
                Bel me nu op
              </button>
              <button
                type="button"
                onClick={() => onChannelChange('whatsapp')}
                className={cn(
                  'flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer',
                  channel === 'whatsapp'
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <MessageCircle className="w-4 h-4" />
                Stuur me een WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => onPrivacyConsentChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer accent-gray-900"
        />
        <span className="text-sm text-gray-600">
          {c?.privacy_text ? (
            <InlineMarkdown text={c.privacy_text} />
          ) : (
            <>
              Ik ga akkoord met de{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-gray-900 hover:text-gray-700">
                privacy policy
              </a>
              <span className="text-red-500">*</span>
            </>
          )}
        </span>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button
          className="bg-gray-900 text-white hover:bg-gray-800 font-medium h-11 px-6"
          disabled={!firstName.trim() || !lastName.trim() || !phoneValue.trim() || !privacyConsent}
          onClick={onSubmit}
        >
          {c?.submit_button ?? 'Solliciteer nu'}
        </Button>
        {onSwitchToCv && (
          <Button variant="outline" className="h-11 px-6" onClick={onSwitchToCv}>
            {c?.secondary_button ?? 'Toch met cv'}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Step 2b: CV Form ─── */

interface CvFormStepProps {
  personaName: string;
  content?: PopupContent['cv_form'];
  firstName: string;
  lastName: string;
  email: string;
  cvFile: File | null;
  cvError: string | null;
  isSubmitting: boolean;
  privacyConsent: boolean;
  onPrivacyConsentChange: (val: boolean) => void;
  onFirstNameChange: (val: string) => void;
  onLastNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onCvFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onSwitchToAnna?: () => void;
  onBack?: () => void;
}

function CvFormStep({
  personaName,
  content: c,
  firstName,
  lastName,
  email,
  cvFile,
  cvError,
  isSubmitting,
  privacyConsent,
  onPrivacyConsentChange,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onCvFileChange,
  onSubmit,
  onSwitchToAnna,
}: CvFormStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center">
          <FileText className="w-3 h-3 text-gray-600" />
        </div>
        <span className="font-medium">{c?.subtitle ?? 'Klassiek solliciteren met cv'}</span>
      </div>

      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        {c?.title ?? 'Upload je cv'}
      </DialogTitle>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">{c?.upload_label ?? 'CV bestand'}</Label>
          <label className="block cursor-pointer">
            <div className={cn(
              'w-full px-4 py-3 h-11 rounded-md border border-dashed transition-colors flex items-center gap-3',
              cvFile
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-300 hover:border-gray-400'
            )}>
              <Upload className="w-4 h-4 text-gray-400 shrink-0" />
              <span className={cn('text-sm truncate', cvFile ? 'text-gray-700' : 'text-gray-400')}>
                {cvFile ? cvFile.name : (c?.upload_placeholder ?? 'Upload je CV (PDF, DOC, DOCX)')}
              </span>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => onCvFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cv-firstname" className="text-sm font-medium text-gray-700">
              Voornaam
            </Label>
            <Input
              id="cv-firstname"
              placeholder="Voornaam"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cv-lastname" className="text-sm font-medium text-gray-700">
              Achternaam
            </Label>
            <Input
              id="cv-lastname"
              placeholder="Achternaam"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cv-email" className="text-sm font-medium text-gray-700">
            {c?.email_label ?? 'E-mailadres'}
          </Label>
          <Input
            id="cv-email"
            type="email"
            placeholder={c?.email_placeholder ?? 'jouw@email.com'}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="h-11"
          />
        </div>

        {cvError && (
          <p className="text-sm text-red-600">{cvError}</p>
        )}
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => onPrivacyConsentChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer accent-gray-900"
        />
        <span className="text-sm text-gray-600">
          {c?.privacy_text ? (
            <InlineMarkdown text={c.privacy_text} />
          ) : (
            <>
              Ik ga akkoord met de{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-gray-900 hover:text-gray-700">
                privacy policy
              </a>
              <span className="text-red-500">*</span>
            </>
          )}
        </span>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button
          className="bg-gray-900 text-white hover:bg-gray-800 font-medium h-11 px-6"
          disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !cvFile || isSubmitting || !privacyConsent}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Bezig...
            </>
          ) : (
            (c?.submit_button ?? 'Solliciteer met cv')
          )}
        </Button>
        {onSwitchToAnna && (
          <Button variant="outline" className="h-11 px-6" onClick={onSwitchToAnna}>
            {c?.secondary_button ?? `Toch met ${personaName}`}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Step 3: Call Prep ─── */

function CallPrepStep({ personaName }: { personaName: string }) {
  const callPrepTips = [
    { icon: Calendar, text: `Dankzij ${personaName} kun je direct een afspraak inplannen met de recruiter — geen formulieren nodig` },
    { icon: Globe, text: 'Je mag in je eigen taal spreken' },
    { icon: Volume2, text: 'Zorg voor een rustige omgeving en vermijd de speaker' },
    { icon: RotateCcw, text: 'Spreek rustig en duidelijk — je kunt altijd vragen om de vraag te herhalen' },
    { icon: UserRound, text: 'Zeg "Ik wil met een mens spreken" om doorverbonden te worden' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-amber-500" />
          </div>
          <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-amber-400/40 animate-ping [animation-duration:2s]" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border border-amber-400/20 animate-ping [animation-duration:2s] [animation-delay:500ms]" />
        </div>
        <div>
          <DialogTitle className="text-2xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
            Klaar voor je gesprek?
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-0.5">
            {personaName} belt je zo meteen op
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {callPrepTips.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed pt-1">{text}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-600 font-medium pt-1">
        Veel succes! 🍀
      </p>
    </div>
  );
}

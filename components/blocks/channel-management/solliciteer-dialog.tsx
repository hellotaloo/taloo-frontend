'use client';

import { useState } from 'react';
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

type Step = 'choose' | 'phone-form' | 'call-prep' | 'cv-form';
type Channel = 'phone' | 'whatsapp';

export interface SolliciteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyTitle: string;
  hasWhatsApp: boolean;
  hasVoice: boolean;
  hasCv: boolean;
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

export function SolliciteerDialog({
  open,
  onOpenChange,
  vacancyId,
  hasWhatsApp,
  hasVoice,
  hasCv,
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
                onSelectPhone={() => setStep('phone-form')}
                onSelectCv={() => setStep('cv-form')}
              />
            )}
            {step === 'phone-form' && (
              <PhoneFormStep
                firstName={firstName}
                lastName={lastName}
                phoneValue={phoneValue}
                channel={channel}
                showChannelToggle={hasBothChannels}
                phoneError={phoneError}
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
                firstName={cvFirstName}
                lastName={cvLastName}
                email={email}
                cvFile={cvFile}
                cvError={cvError}
                isSubmitting={isSubmittingCv}
                onFirstNameChange={setCvFirstName}
                onLastNameChange={setCvLastName}
                onEmailChange={setEmail}
                onCvFileChange={setCvFile}
                onSubmit={handleCvSubmit}
                onSwitchToAnna={hasPhoneOption ? () => setStep('phone-form') : undefined}
                onBack={hasBothOptions ? () => setStep('choose') : undefined}
              />
            )}
            {step === 'call-prep' && <CallPrepStep />}
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

function ChooseStep({ onSelectPhone, onSelectCv }: { onSelectPhone: () => void; onSelectCv: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <span className="font-medium">Solliciteer sneller met Anna, je digitale assistent</span>
      </div>

      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        Hoe wil je solliciteren?
      </DialogTitle>

      <p className="text-gray-600 text-base leading-relaxed">
        Sneller: laat je nummer achter en Anna, onze digitale assistent, belt je{' '}
        <span className="font-semibold text-gray-900">meteen</span> op. Daarna
        kan je binnen <span className="font-semibold text-gray-900">3 dagen</span>{' '}
        met een recruiter spreken.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div
          onClick={onSelectPhone}
          className="relative flex flex-col rounded-xl border-2 border-gray-900 bg-gray-50/50 p-5 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5"
        >
          <span className="absolute -top-2.5 right-4 bg-brand-lime-green text-gray-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
            Aanrader
          </span>
          <span className="font-semibold text-gray-900 mt-1">Sneller met Anna</span>
          <p className="text-sm text-gray-600 leading-relaxed mt-1.5 flex-1">
            Anna belt je meteen op voor een kort gesprek.
          </p>
          <div className="mt-4 bg-gray-900 text-white w-full h-9 text-sm font-medium rounded-md flex items-center justify-center pointer-events-none">
            Solliciteer met Anna
          </div>
        </div>

        <div
          onClick={onSelectCv}
          className="relative flex flex-col rounded-xl border-2 border-gray-200 p-5 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5"
        >
          <span className="font-semibold text-gray-900">Klassiek met cv</span>
          <p className="text-sm text-gray-600 leading-relaxed mt-1.5 flex-1">
            Upload je cv en solliciteer zoals je gewend bent.
          </p>
          <div className="mt-4 w-full h-9 text-sm font-medium rounded-md border border-gray-300 flex items-center justify-center pointer-events-none">
            Solliciteer met cv
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2a: Phone Form ─── */

interface PhoneFormStepProps {
  firstName: string;
  lastName: string;
  phoneValue: string;
  channel: Channel;
  showChannelToggle: boolean;
  phoneError: string | null;
  onFirstNameChange: (val: string) => void;
  onLastNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onChannelChange: (val: Channel) => void;
  onSubmit: () => void;
  onSwitchToCv?: () => void;
  onBack?: () => void;
}

function PhoneFormStep({
  firstName,
  lastName,
  phoneValue,
  channel,
  showChannelToggle,
  phoneError,
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
        <span className="font-medium">Sneller solliciteren met Anna, je digitale assistent</span>
      </div>

      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        Laat je gegevens achter
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
              Hoe mogen we je contacteren?
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
                Telefoon
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
                WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button
          className="bg-gray-900 text-white hover:bg-gray-800 font-medium h-11 px-6"
          disabled={!firstName.trim() || !lastName.trim() || !phoneValue.trim()}
          onClick={onSubmit}
        >
          {channel === 'whatsapp' ? 'Start WhatsApp' : 'Laat Anna bellen'}
        </Button>
        {onSwitchToCv && (
          <Button variant="outline" className="h-11 px-6" onClick={onSwitchToCv}>
            Toch met cv
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Anna, onze digitale assistent, contacteert je meteen via {channel === 'whatsapp' ? 'WhatsApp' : 'telefoon'}.
      </p>
    </div>
  );
}

/* ─── Step 2b: CV Form ─── */

interface CvFormStepProps {
  firstName: string;
  lastName: string;
  email: string;
  cvFile: File | null;
  cvError: string | null;
  isSubmitting: boolean;
  onFirstNameChange: (val: string) => void;
  onLastNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onCvFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onSwitchToAnna?: () => void;
  onBack?: () => void;
}

function CvFormStep({
  firstName,
  lastName,
  email,
  cvFile,
  cvError,
  isSubmitting,
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
        <span className="font-medium">Klassiek solliciteren met cv</span>
      </div>

      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        Upload je cv
      </DialogTitle>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">CV bestand</Label>
          <label className="block cursor-pointer">
            <div className={cn(
              'w-full px-4 py-3 h-11 rounded-md border border-dashed transition-colors flex items-center gap-3',
              cvFile
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-300 hover:border-gray-400'
            )}>
              <Upload className="w-4 h-4 text-gray-400 shrink-0" />
              <span className={cn('text-sm truncate', cvFile ? 'text-gray-700' : 'text-gray-400')}>
                {cvFile ? cvFile.name : 'Upload je CV (PDF, DOC, DOCX)'}
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
            E-mailadres
          </Label>
          <Input
            id="cv-email"
            type="email"
            placeholder="jouw@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="h-11"
          />
        </div>

        {cvError && (
          <p className="text-sm text-red-600">{cvError}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button
          className="bg-gray-900 text-white hover:bg-gray-800 font-medium h-11 px-6"
          disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !cvFile || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Bezig...
            </>
          ) : (
            'Solliciteer met cv'
          )}
        </Button>
        {onSwitchToAnna && (
          <Button variant="outline" className="h-11 px-6" onClick={onSwitchToAnna}>
            Toch met Anna
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Step 3: Call Prep ─── */

const callPrepTips = [
  { icon: Calendar, text: 'Dankzij Anna kun je direct een afspraak inplannen met de recruiter — geen formulieren nodig' },
  { icon: Globe, text: 'Je mag in je eigen taal spreken' },
  { icon: Volume2, text: 'Zorg voor een rustige omgeving en vermijd de speaker' },
  { icon: RotateCcw, text: 'Spreek rustig en duidelijk — je kunt altijd vragen om de vraag te herhalen' },
  { icon: UserRound, text: 'Zeg "Ik wil met een mens spreken" om doorverbonden te worden' },
];

function CallPrepStep() {
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
            Anna belt je zo meteen op
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

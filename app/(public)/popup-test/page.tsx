'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
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
} from 'lucide-react';

type Step = 'choose' | 'phone-form' | 'call-prep' | 'cv-form';
type Channel = 'phone' | 'whatsapp';

export default function PopupTestPage() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('choose');

  // Phone flow fields (matches: phoneFirstName, phoneLastName, phoneValue, phoneContactMethod)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [channel, setChannel] = useState<Channel>('phone');

  // CV flow fields (matches: firstName, lastName, emailValue, cvFile)
  const [cvFirstName, setCvFirstName] = useState('');
  const [cvLastName, setCvLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStep('choose');
      setFirstName('');
      setLastName('');
      setPhoneValue('');
      setChannel('phone');
      setCvFirstName('');
      setCvLastName('');
      setEmail('');
      setCvFile(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-4 p-4">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="bg-gray-900 text-white hover:bg-gray-800 text-base px-8 py-3 h-auto">
            Solliciteer
          </Button>
        </DialogTrigger>

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
                  onFirstNameChange={setFirstName}
                  onLastNameChange={setLastName}
                  onPhoneChange={setPhoneValue}
                  onChannelChange={setChannel}
                  onBack={() => setStep('choose')}
                  onNext={() => setStep('call-prep')}
                  onSwitchToCv={() => setStep('cv-form')}
                />
              )}
              {step === 'cv-form' && (
                <CvFormStep
                  firstName={cvFirstName}
                  lastName={cvLastName}
                  email={email}
                  cvFile={cvFile}
                  onFirstNameChange={setCvFirstName}
                  onLastNameChange={setCvLastName}
                  onEmailChange={setEmail}
                  onCvFileChange={setCvFile}
                  onBack={() => setStep('choose')}
                  onSwitchToAnna={() => setStep('phone-form')}
                />
              )}
              {step === 'call-prep' && (
                <CallPrepStep
                  onBack={() => setStep('phone-form')}
                />
              )}
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
      <Button
        variant="outline"
        className="text-base px-8 py-3 h-auto"
        onClick={() => { setStep('call-prep'); setOpen(true); }}
      >
        Klaar voor je gesprek?
      </Button>
    </div>
  );
}

/* ─── Step 1: Choose ─── */

function ChooseStep({ onSelectPhone, onSelectCv }: { onSelectPhone: () => void; onSelectCv: () => void }) {
  return (
    <div className="space-y-6">
      {/* Subtitle */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <span className="font-medium">Solliciteer sneller met Anna, je digitale assistent</span>
      </div>

      {/* Heading */}
      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        Hoe wil je solliciteren?
      </DialogTitle>

      {/* Description */}
      <p className="text-gray-600 text-base leading-relaxed">
        Sneller: laat je nummer achter en Anna, onze digitale assistent, belt je{' '}
        <span className="font-semibold text-gray-900">meteen</span> op. Daarna
        kan je binnen <span className="font-semibold text-gray-900">3 dagen</span>{' '}
        met een recruiter spreken.
      </p>

      {/* Option cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Sneller met Anna */}
        <div
          onClick={onSelectPhone}
          className="relative flex flex-col rounded-xl border-2 border-gray-900 bg-gray-50/50 p-5 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5"
        >
          <span className="absolute -top-2.5 right-4 bg-brand-lime-green text-gray-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
            Aanrader
          </span>
          <span className="font-semibold text-gray-900 mt-1">
            Sneller met Anna
          </span>
          <p className="text-sm text-gray-600 leading-relaxed mt-1.5 flex-1">
            Anna belt je meteen op voor een kort gesprek.
          </p>
          <div className="mt-4 bg-gray-900 text-white w-full h-9 text-sm font-medium rounded-md flex items-center justify-center pointer-events-none">
            Solliciteer met Anna
          </div>
        </div>

        {/* Klassiek met cv */}
        <div
          onClick={onSelectCv}
          className="relative flex flex-col rounded-xl border-2 border-gray-200 p-5 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5"
        >
          <span className="font-semibold text-gray-900">
            Klassiek met cv
          </span>
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
  onFirstNameChange: (val: string) => void;
  onLastNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onChannelChange: (val: Channel) => void;
  onBack: () => void;
  onNext: () => void;
  onSwitchToCv: () => void;
}

function PhoneFormStep({
  firstName,
  lastName,
  phoneValue,
  channel,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onChannelChange,
  onBack,
  onNext,
  onSwitchToCv,
}: PhoneFormStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Subtitle */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
          <Smartphone className="w-3 h-3 text-white" />
        </div>
        <span className="font-medium">Sneller solliciteren met Anna, je digitale assistent</span>
      </div>

      {/* Heading */}
      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        Laat je gegevens achter
      </DialogTitle>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="phone-firstname"
              className="text-sm font-medium text-gray-700"
            >
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
            <Label
              htmlFor="phone-lastname"
              className="text-sm font-medium text-gray-700"
            >
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

        {/* Phone */}
        <div className="space-y-1.5">
          <Label
            htmlFor="phone-number"
            className="text-sm font-medium text-gray-700"
          >
            Gsm-nummer
          </Label>
          <Input
            id="phone-number"
            type="tel"
            placeholder="+32 4xx xx xx xx"
            value={phoneValue}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Channel selection */}
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
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          className="bg-gray-900 text-white hover:bg-gray-800 font-medium h-11 px-6"
          disabled={!firstName.trim() || !lastName.trim() || !phoneValue.trim()}
          onClick={onNext}
        >
          Laat Anna bellen
        </Button>
        <Button variant="outline" className="h-11 px-6" onClick={onSwitchToCv}>
          Toch met cv
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-400">
        Anna, onze digitale assistent, contacteert je meteen via telefoon of WhatsApp.
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
  onFirstNameChange: (val: string) => void;
  onLastNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onCvFileChange: (file: File | null) => void;
  onBack: () => void;
  onSwitchToAnna: () => void;
}

function CvFormStep({
  firstName,
  lastName,
  email,
  cvFile,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onCvFileChange,
  onBack,
  onSwitchToAnna,
}: CvFormStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Subtitle */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center">
          <FileText className="w-3 h-3 text-gray-600" />
        </div>
        <span className="font-medium">Klassiek solliciteren met cv</span>
      </div>

      {/* Heading */}
      <DialogTitle className="text-3xl font-semibold text-gray-900 tracking-tight font-serif !leading-tight">
        Upload je cv
      </DialogTitle>

      {/* Form fields */}
      <div className="space-y-4">
        {/* CV Upload */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            CV bestand
          </Label>
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

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="cv-firstname"
              className="text-sm font-medium text-gray-700"
            >
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
            <Label
              htmlFor="cv-lastname"
              className="text-sm font-medium text-gray-700"
            >
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

        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="cv-email"
            className="text-sm font-medium text-gray-700"
          >
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
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          className="bg-gray-900 text-white hover:bg-gray-800 font-medium h-11 px-6"
          disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !cvFile}
        >
          Solliciteer met cv
        </Button>
        <Button variant="outline" className="h-11 px-6" onClick={onSwitchToAnna}>
          Toch met Anna
        </Button>
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

function CallPrepStep({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Icon + heading */}
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

      {/* Tips */}
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

      {/* Good luck */}
      <p className="text-sm text-gray-600 font-medium pt-1">
        Veel succes! 🍀
      </p>
    </div>
  );
}

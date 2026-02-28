'use client';

import { useState, useEffect } from 'react';
import { FileText, MessageCircle, Phone, Smartphone, X, Upload, Loader2, CheckCircle2, Calendar, Check, Volume2, Globe, RotateCcw, ArrowLeft, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  initiateOutboundScreening,
  isValidPhoneNumber,
  formatPhoneNumber,
  getScreeningErrorMessage,
  ScreeningChannel,
  submitCVApplication,
  parseCVResponse,
  CVFormData,
} from '@/lib/screening-api';
import type { CVAnalysisResult } from '@/lib/types';

export interface ApplicationFormProps {
  vacancyId: string;
  vacancyTitle: string;
  hasWhatsApp: boolean;
  hasVoice: boolean;
  hasCv: boolean;
  /** Source identifier — 'test' marks as test screening, all others are real. */
  source?: string;
  /** Called when user requests to close (X button, "Nee bedankt", etc.) */
  onClose?: () => void;
  /** Called on successful submission */
  onSuccess?: (result: { method: 'email' | 'whatsapp' | 'phone'; applicationId?: string }) => void;
  /** If provided, called instead of the API when "Start gesprek" is clicked (for demo/playground use) */
  onStartCall?: () => void;
}

// Random Dutch names for testing
const DUTCH_FIRST_NAMES = ['Jan', 'Pieter', 'Koen', 'Daan', 'Luuk', 'Bram', 'Lars', 'Sven', 'Thijs', 'Ruben', 'Eva', 'Lotte', 'Fleur', 'Sanne', 'Femke'];
const DUTCH_LAST_NAMES = ['de Jong', 'Jansen', 'de Vries', 'Bakker', 'Visser', 'Smit', 'Mulder', 'de Boer', 'Peters', 'Hendriks'];

function getRandomName() {
  const firstName = DUTCH_FIRST_NAMES[Math.floor(Math.random() * DUTCH_FIRST_NAMES.length)];
  const lastName = DUTCH_LAST_NAMES[Math.floor(Math.random() * DUTCH_LAST_NAMES.length)];
  return { firstName, lastName };
}

type ApplicationMethod = 'email' | 'whatsapp' | 'phone';
type PhoneContactMethod = 'whatsapp' | 'phone';
type CvSubmissionStep = 'form' | 'processing' | 'confirmation';

const CV_PROCESSING_STEPS = [
  'CV inlezen',
  'Ervaring en vaardigheden analyseren',
  'Afstemmen op vacature-eisen',
  'Antwoorden samenstellen',
  'Bijna klaar…',
] as const;

export function ApplicationForm({
  vacancyId,
  vacancyTitle,
  hasWhatsApp,
  hasVoice,
  hasCv,
  source,
  onClose,
  onSuccess,
  onStartCall,
}: ApplicationFormProps) {
  const isTest = source === 'test';

  // CV section fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvStep, setCvStep] = useState<CvSubmissionStep>('form');
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [cvResult, setCvResult] = useState<CVAnalysisResult | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  // Phone section fields - pre-filled with random Dutch name for testing (local only)
  const isLocal = process.env.NODE_ENV === 'development';
  const [randomName] = useState(() => getRandomName());
  const [phoneFirstName, setPhoneFirstName] = useState(isLocal ? randomName.firstName : '');
  const [phoneLastName, setPhoneLastName] = useState(isLocal ? randomName.lastName : '');
  const [phoneValue, setPhoneValue] = useState(isLocal ? '+32 487441391' : '');
  // Default to whichever channel is available
  const defaultPhoneMethod: PhoneContactMethod = hasWhatsApp ? 'whatsapp' : 'phone';
  const [phoneContactMethod, setPhoneContactMethod] = useState<PhoneContactMethod>(defaultPhoneMethod);
  const [isSubmitting, setIsSubmitting] = useState<ApplicationMethod | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showCallPrep, setShowCallPrep] = useState(false);

  const hasPhoneOption = hasWhatsApp || hasVoice;

  // Sync phoneContactMethod when available channels change
  useEffect(() => {
    if (phoneContactMethod === 'phone' && !hasVoice && hasWhatsApp) {
      setPhoneContactMethod('whatsapp');
    } else if (phoneContactMethod === 'whatsapp' && !hasWhatsApp && hasVoice) {
      setPhoneContactMethod('phone');
    }
  }, [hasWhatsApp, hasVoice, phoneContactMethod]);
  const hasBothPhoneOptions = hasWhatsApp && hasVoice;

  // Advance processing step every 2.5s while CV is processing (cap at last step)
  useEffect(() => {
    if (cvStep !== 'processing') return;
    const interval = setInterval(() => {
      setProcessingStepIndex((prev) =>
        prev >= CV_PROCESSING_STEPS.length - 1 ? prev : prev + 1
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [cvStep]);

  // Reset CV form state
  const resetCvForm = () => {
    setFirstName('');
    setLastName('');
    setEmailValue('');
    setCvFile(null);
    setCvStep('form');
    setCvResult(null);
    setCvError(null);
  };

  const handleClose = () => {
    resetCvForm();
    onClose?.();
  };

  // Validate phone and show call prep screen for voice calls
  const handlePhoneAction = (method: PhoneContactMethod) => {
    setPhoneError(null);

    const formattedPhone = formatPhoneNumber(phoneValue);
    if (!isValidPhoneNumber(formattedPhone)) {
      setPhoneError('Ongeldig telefoonnummer formaat. Gebruik internationaal formaat (bijv. +32471234567).');
      return;
    }

    // Voice calls get a preparation screen; WhatsApp submits directly
    if (method === 'phone') {
      setShowCallPrep(true);
    } else {
      handleSubmit('whatsapp');
    }
  };

  const handleSubmit = async (method: ApplicationMethod) => {
    setIsSubmitting(method);
    setPhoneError(null);

    // Handle CV submission via the CV Application API
    if (method === 'email') {
      if (!cvFile) {
        setCvError('Selecteer eerst een CV bestand.');
        setIsSubmitting(null);
        return;
      }

      // Show processing screen and reset step index
      setProcessingStepIndex(0);
      setCvStep('processing');
      setCvError(null);
      setIsSubmitting(null);

      try {
        const formData: CVFormData = {
          file: cvFile,
          firstName,
          lastName,
          email: emailValue,
        };

        const response = await submitCVApplication(vacancyId, formData);
        const result = parseCVResponse(response);

        setCvResult(result);
        setCvStep('confirmation');
        onSuccess?.({ method: 'email', applicationId: result.applicationId });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis bij het verwerken van je CV.';
        setCvError(errorMessage);
        setCvStep('form');
      }
      return;
    }

    // Handle phone/WhatsApp via outbound screening API
    const formattedPhone = formatPhoneNumber(phoneValue);

    // Validate phone number
    if (!isValidPhoneNumber(formattedPhone)) {
      setPhoneError('Ongeldig telefoonnummer formaat. Gebruik internationaal formaat (bijv. +32471234567).');
      setIsSubmitting(null);
      return;
    }

    // Map method to API channel
    const channel: ScreeningChannel = method === 'whatsapp' ? 'whatsapp' : 'voice';

    try {
      const result = await initiateOutboundScreening({
        vacancy_id: vacancyId,
        channel,
        phone_number: formattedPhone,
        first_name: phoneFirstName || undefined,
        last_name: phoneLastName || undefined,
        is_test: isTest,
      });

      if (result.success) {
        if (channel === 'voice') {
          toast.success('De kandidaat wordt nu gebeld');
        } else {
          toast.success('WhatsApp bericht verzonden!');
        }

        onSuccess?.({ method });
        onClose?.();
        if (isLocal) {
          const newName = getRandomName();
          setPhoneFirstName(newName.firstName);
          setPhoneLastName(newName.lastName);
          setPhoneValue('+32 487441391');
        } else {
          setPhoneFirstName('');
          setPhoneLastName('');
          setPhoneValue('');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis';
      setPhoneError(getScreeningErrorMessage(errorMessage));
    } finally {
      setIsSubmitting(null);
    }
  };

  const hasBothOptions = hasCv && hasPhoneOption;

  return (
    <>
      {/* Close button - hide during processing */}
      {cvStep !== 'processing' && onClose && (
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      )}

      {/* CV Processing Screen */}
      {cvStep === 'processing' && (
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <Loader2 className="w-12 h-12 text-[#FEAE03] animate-spin mb-6" />
          <h2 className="text-2xl font-semibold text-[#21224B] mb-2">CV uploaden & verwerken</h2>
          <p className="text-gray-500 text-center mb-6">Even geduld, we analyseren je CV...</p>
          <div className="w-full max-w-sm border-l-2 border-gray-200 pl-4 space-y-2 text-left">
            {CV_PROCESSING_STEPS.map((label, index) => {
              const isDone = index < processingStepIndex;
              const isCurrent = index === processingStepIndex;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-base transition-colors ${
                    isDone
                      ? 'text-gray-400'
                      : isCurrent
                        ? 'text-gray-700 font-medium'
                        : 'text-gray-400'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 shrink-0 text-gray-400" />
                  ) : isCurrent ? (
                    <span className="w-1 h-1 rounded-full bg-[#FEAE03] shrink-0 animate-pulse" />
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CV Confirmation Screen */}
      {cvStep === 'confirmation' && cvResult && (
        <>
          {/* Success - Candidate is a match, show booking options */}
          {!cvResult.needsClarification && (
            <div className="flex flex-col items-center justify-center py-12 px-8 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#FEAE03]/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-[#FEAE03]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#21224B] mb-2 text-center">
                Je bent een match!
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Boek meteen een gesprek in met de recruiter
              </p>

              {/* Booking slots */}
              {cvResult.meetingSlots.length > 0 && (
                <div className="w-full space-y-3 mb-4">
                  {cvResult.meetingSlots.map((slot, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#FEAE03] hover:bg-[#FEAE03]/5 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#FEAE03]/20 flex items-center justify-center transition-colors">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#21224B] capitalize">{slot}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Contact me option */}
              <button
                onClick={handleClose}
                className="w-full py-3 px-4 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-base"
              >
                Contacteer mij voor een ander moment
              </button>
            </div>
          )}

          {/* Clarification needed - Ask for follow-up contact */}
          {cvResult.needsClarification && (
            <div className="flex flex-col items-center py-12 px-8">
              <div className="w-16 h-16 rounded-full bg-[#FEAE03]/20 flex items-center justify-center mb-6 shrink-0">
                <CheckCircle2 className="w-8 h-8 text-[#FEAE03]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#21224B] mb-4 text-center">
                Bedankt voor je sollicitatie!
              </h2>
              <div className="max-w-md mx-auto mb-6">
                <p className="text-gray-600 text-center text-base leading-relaxed">
                <strong>Izzy, onze digitale assistent,</strong> stelt eventueel nog een paar korte vragen om het gesprek met de recruiter goed voor te bereiden.
                De beslissing ligt altijd bij de recruiter.
                </p>
              </div>

              {/* Contact method selection */}
              <div className="w-full max-w-md space-y-4">
                {/* Toggle between WhatsApp and Call - only show if both are available */}
                {hasBothPhoneOptions && (
                  <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPhoneContactMethod('whatsapp')}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        phoneContactMethod === 'whatsapp'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneContactMethod('phone')}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        phoneContactMethod === 'phone'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Bellen
                    </button>
                  </div>
                )}

                {/* Phone input */}
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border bg-white ${
                  phoneError ? 'border-red-300' : 'border-gray-200'
                }`}>
                  {/* Belgian flag */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-6 h-4 rounded-sm overflow-hidden flex">
                      <div className="w-1/3 bg-black" />
                      <div className="w-1/3 bg-yellow-400" />
                      <div className="w-1/3 bg-red-500" />
                    </div>
                  </div>
                  <input
                    type="tel"
                    value={phoneValue}
                    onChange={(e) => {
                      setPhoneValue(e.target.value);
                      setPhoneError(null);
                    }}
                    className="flex-1 text-gray-700 focus:outline-none bg-transparent"
                    placeholder="+32 XXX XX XX XX"
                  />
                </div>

                {/* Error message */}
                {phoneError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-base">
                    {phoneError}
                  </div>
                )}

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Nee, bedankt
                  </button>
                  <button
                    onClick={() => handlePhoneAction(phoneContactMethod)}
                    disabled={phoneValue.replace(/\s/g, '').length < 12 || isSubmitting !== null}
                    className="flex-1 py-3 px-4 rounded-lg bg-[#21224B] text-[#FEAE03] font-medium hover:bg-[#2a2c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting === phoneContactMethod
                      ? 'Bezig...'
                      : phoneContactMethod === 'whatsapp' ? 'WhatsApp mij' : 'Bel mij'
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Voice Call Preparation Screen */}
      {showCallPrep && (
        <div className="flex flex-col items-center py-12 px-8">
          <div className="w-16 h-16 rounded-full bg-[#FEAE03]/20 flex items-center justify-center mb-6">
            <Phone className="w-8 h-8 text-[#FEAE03]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#21224B] mb-2 text-center">
            Klaar voor je gesprek?
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Onze agent belt je zo meteen op
          </p>

          <div className="w-full max-w-md space-y-3 mb-8">
            {[
              { icon: Calendar, text: 'Dankzij de agent kun je direct een afspraak inplannen met de recruiter — geen formulieren nodig' },
              { icon: Globe, text: 'Je mag in je eigen taal spreken' },
              { icon: Volume2, text: 'Zorg voor een rustige omgeving en vermijd de speaker' },
              { icon: RotateCcw, text: 'Spreek rustig en duidelijk — je kunt altijd vragen om de vraag te herhalen' },
              { icon: UserRound, text: 'Zeg "Ik wil met een mens spreken" om doorverbonden te worden' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-base text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 w-full max-w-md">
            <button
              onClick={() => setShowCallPrep(false)}
              className="flex-1 py-3 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug
            </button>
            <button
              onClick={() => onStartCall ? onStartCall() : handleSubmit('phone')}
              disabled={isSubmitting !== null}
              className="flex-1 py-3 px-4 rounded-lg bg-[#21224B] text-[#FEAE03] font-medium hover:bg-[#2a2c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isSubmitting === 'phone' ? 'Bellen...' : (
                <>
                  <Phone className="w-4 h-4" />
                  Start gesprek
                </>
              )}
            </button>
          </div>

          {phoneError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-base mt-4 w-full max-w-md">
              {phoneError}
            </div>
          )}
        </div>
      )}

      {/* Main form screens */}
      {cvStep === 'form' && !showCallPrep && (
        <>
          {/* Only show title when both options are available */}
          {hasCv && hasPhoneOption && (
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-3xl font-semibold text-center text-[#21224B]">
                Hoe wil je solliciteren?
              </h2>
            </div>
          )}

          {/* Option cards - 2 columns if both options available, 1 column otherwise */}
          <div className={`grid gap-5 px-8 pb-8 ${hasCv && hasPhoneOption ? 'sm:grid-cols-2 grid-cols-1' : 'grid-cols-1'} ${!(hasCv && hasPhoneOption) ? 'pt-14' : ''}`}>
            {/* Option 1: Apply with CV - only show if CV channel is enabled */}
            {hasCv && (
            <div className="flex flex-col rounded-xl border border-gray-200 p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-gray-900">Solliciteer met CV</h3>
              </div>
              <p className="text-base text-gray-600 mb-6 grow">
                Upload je CV en vul je gegevens in. We nemen je sollicitatie direct in behandeling.
              </p>
              <div className="space-y-3">
                {/* CV Upload */}
                <label className="block">
                  <div className={`w-full px-4 py-3 rounded-lg border border-dashed cursor-pointer transition-colors ${
                    cvFile
                      ? 'border-[#FEAE03] bg-[#FEAE03]/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className={`text-base ${cvFile ? 'text-gray-700' : 'text-gray-400'}`}>
                        {cvFile ? cvFile.name : 'Upload je CV (PDF, DOC, DOCX)'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Voornaam"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FEAE03]/50 focus:border-[#FEAE03]"
                  />
                  <input
                    type="text"
                    placeholder="Achternaam"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FEAE03]/50 focus:border-[#FEAE03]"
                  />
                </div>
                <input
                  type="email"
                  placeholder="jouw@email.com"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FEAE03]/50 focus:border-[#FEAE03]"
                />

                {/* CV Error message */}
                {cvError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-base">
                    {cvError}
                  </div>
                )}

                <button
                  onClick={() => handleSubmit('email')}
                  disabled={!emailValue || !firstName || !lastName || !cvFile || isSubmitting !== null}
                  className="w-full py-3 px-4 rounded-lg bg-[#21224B] text-[#FEAE03] font-medium hover:bg-[#2a2c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting === 'email' ? 'Bezig...' : 'Solliciteer met CV'}
                </button>
              </div>
            </div>
            )}

            {/* Option 2: Apply by phone (WhatsApp or Voice) */}
            {hasPhoneOption && (
              <div className="flex flex-col rounded-xl border border-gray-200 p-6 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  {hasWhatsApp && !hasVoice ? (
                    <MessageCircle className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                  ) : (
                    <Smartphone className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {hasWhatsApp && !hasVoice
                      ? 'Solliciteer via WhatsApp'
                      : 'Solliciteer via gsm'}
                  </h3>
                </div>
                <p className="text-base text-gray-600 mb-4 grow">
                  Geen CV, geen formulieren. Onze virtuele assistent begeleidt je en regelt de rest.
                </p>

                {/* Toggle between WhatsApp and Call - only show if both are available */}
                {hasBothPhoneOptions && (
                  <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                    <button
                      type="button"
                      onClick={() => setPhoneContactMethod('whatsapp')}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        phoneContactMethod === 'whatsapp'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp mij
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneContactMethod('phone')}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        phoneContactMethod === 'phone'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Bel mij
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Voornaam"
                      value={phoneFirstName}
                      onChange={(e) => setPhoneFirstName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FEAE03]/50 focus:border-[#FEAE03]"
                    />
                    <input
                      type="text"
                      placeholder="Achternaam"
                      value={phoneLastName}
                      onChange={(e) => setPhoneLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FEAE03]/50 focus:border-[#FEAE03]"
                    />
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border bg-white ${
                    phoneError ? 'border-red-300' : 'border-gray-200'
                  }`}>
                    {/* Belgian flag */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-6 h-4 rounded-sm overflow-hidden flex">
                        <div className="w-1/3 bg-black" />
                        <div className="w-1/3 bg-yellow-400" />
                        <div className="w-1/3 bg-red-500" />
                      </div>
                    </div>
                    <input
                      type="tel"
                      value={phoneValue}
                      onChange={(e) => {
                        setPhoneValue(e.target.value);
                        setPhoneError(null);
                      }}
                      className="flex-1 text-gray-700 focus:outline-none bg-transparent"
                      placeholder="+32 XXX XX XX XX"
                    />
                  </div>

                  {/* Error message */}
                  {phoneError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-base">
                      {phoneError}
                    </div>
                  )}

                  <button
                    onClick={() => handlePhoneAction(phoneContactMethod)}
                    disabled={phoneValue.replace(/\s/g, '').length < 12 || !phoneFirstName || !phoneLastName || isSubmitting !== null}
                    className="w-full py-3 px-4 rounded-lg bg-[#21224B] text-[#FEAE03] font-medium hover:bg-[#2a2c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting === phoneContactMethod
                      ? phoneContactMethod === 'whatsapp' ? 'Bezig...' : 'Bellen...'
                      : phoneContactMethod === 'whatsapp' ? 'Doorgaan met WhatsApp' : 'Bel mij op'
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

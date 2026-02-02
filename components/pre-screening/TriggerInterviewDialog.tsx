'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { FileText, MessageCircle, Phone, X, Upload, Loader2, CheckCircle2, Calendar, Check } from 'lucide-react';
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

interface TriggerInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyTitle: string;
  hasWhatsApp: boolean;
  hasVoice: boolean;
  hasCv: boolean;
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

export function TriggerInterviewDialog({
  open,
  onOpenChange,
  vacancyId,
  vacancyTitle,
  hasWhatsApp,
  hasVoice,
  hasCv,
}: TriggerInterviewDialogProps) {
  // CV section fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvStep, setCvStep] = useState<CvSubmissionStep>('form');
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [cvResult, setCvResult] = useState<CVAnalysisResult | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  // Phone section fields
  const [phoneFirstName, setPhoneFirstName] = useState('');
  const [phoneLastName, setPhoneLastName] = useState('');
  const [phoneValue, setPhoneValue] = useState('+32 ');
  // Default to whichever channel is available
  const defaultPhoneMethod: PhoneContactMethod = hasWhatsApp ? 'whatsapp' : 'phone';
  const [phoneContactMethod, setPhoneContactMethod] = useState<PhoneContactMethod>(defaultPhoneMethod);
  const [isSubmitting, setIsSubmitting] = useState<ApplicationMethod | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  const hasPhoneOption = hasWhatsApp || hasVoice;

  // Sync phoneContactMethod when available channels change
  useEffect(() => {
    // If current method is not available, switch to the available one
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

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset CV form when closing
      resetCvForm();
    }
    onOpenChange(open);
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
        is_test: true,
      });
      
      if (result.success) {
        // Show success toast
        if (channel === 'voice') {
          toast.success('De kandidaat wordt nu gebeld');
        } else {
          toast.success('WhatsApp bericht verzonden!');
        }
        
        // Close dialog and reset
        onOpenChange(false);
        setPhoneFirstName('');
        setPhoneLastName('');
        setPhoneValue('+32 ');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis';
      setPhoneError(getScreeningErrorMessage(errorMessage));
    } finally {
      setIsSubmitting(null);
    }
  };

  // Determine if we have both options or just one
  const hasBothOptions = hasCv && hasPhoneOption;

  return (
    <AlertDialog open={open} onOpenChange={handleDialogClose}>
      <AlertDialogContent className={`p-0 gap-0 overflow-hidden ${hasBothOptions ? 'max-w-5xl!' : 'max-w-[450px]'}`}>
        {/* Close button - hide during processing */}
        {cvStep !== 'processing' && (
          <button
            onClick={() => handleDialogClose(false)}
            className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}

        {/* CV Processing Screen */}
        {cvStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <VisuallyHidden.Root>
              <AlertDialogTitle>CV uploaden & verwerken</AlertDialogTitle>
            </VisuallyHidden.Root>
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
                    className={`flex items-center gap-2 text-sm transition-colors ${
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
                <VisuallyHidden.Root>
                  <AlertDialogTitle>Je bent een match</AlertDialogTitle>
                </VisuallyHidden.Root>
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
                  onClick={() => handleDialogClose(false)}
                  className="w-full py-3 px-4 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Contacteer mij voor een ander moment
                </button>
              </div>
            )}

            {/* Clarification needed - Ask for follow-up contact */}
            {cvResult.needsClarification && (
              <div className="flex flex-col items-center py-12 px-8">
                <VisuallyHidden.Root>
                  <AlertDialogTitle>Bedankt voor je sollicitatie!</AlertDialogTitle>
                </VisuallyHidden.Root>
                <div className="w-16 h-16 rounded-full bg-[#FEAE03]/20 flex items-center justify-center mb-6 shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-[#FEAE03]" />
                </div>
                <h2 className="text-2xl font-semibold text-[#21224B] mb-4 text-center">
                  Bedankt voor je sollicitatie!
                </h2>
                <div className="max-w-md mx-auto mb-6">
                  <p className="text-gray-600 text-center text-sm leading-relaxed">
                  <strong>Izzy, onze digitale assistent,</strong> stelt eventueel nog een paar korte vragen om het gesprek met de recruiter goed voor te bereiden. 
                  De beslissing ligt altijd bij de recruiter.
                  </p>
                </div>

                {/* Contact method selection - same width as before, no max-w-2xl */}
                <div className="w-full max-w-md space-y-4">
                  {/* Toggle between WhatsApp and Call - only show if both are available */}
                  {hasBothPhoneOptions && (
                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setPhoneContactMethod('whatsapp')}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      {phoneError}
                    </div>
                  )}

                  <div className="flex gap-3 w-full pt-2">
                    <button
                      onClick={() => handleDialogClose(false)}
                      className="flex-1 py-3 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Nee, bedankt
                    </button>
                    <button
                      onClick={() => handleSubmit(phoneContactMethod)}
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

        {/* Main form screens */}
        {cvStep === 'form' && (
          <>
            {/* Only show title when both options are available */}
            {hasCv && hasPhoneOption ? (
              <AlertDialogHeader className="px-8 pt-8 pb-6">
                <AlertDialogTitle className="text-3xl font-semibold text-center text-[#21224B]">
                  Hoe wil je solliciteren?
                </AlertDialogTitle>
              </AlertDialogHeader>
            ) : (
              <VisuallyHidden.Root>
                <AlertDialogTitle>
                  {hasCv ? 'Solliciteer met CV' : hasWhatsApp ? 'Solliciteer via WhatsApp' : 'Solliciteer via telefoon'}
                </AlertDialogTitle>
              </VisuallyHidden.Root>
            )}

        {/* Option cards - 2 columns if both options available, 1 column otherwise */}
        <div className={`grid gap-5 px-8 pb-8 ${hasCv && hasPhoneOption ? 'grid-cols-2' : 'grid-cols-1'} ${!(hasCv && hasPhoneOption) ? 'pt-14' : ''}`}>
          {/* Option 1: Apply with CV - only show if CV channel is enabled */}
          {hasCv && (
          <div className="flex flex-col rounded-xl border border-gray-200 p-6 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold text-gray-900">Solliciteer met CV</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 grow">
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
                    <span className={`text-sm ${cvFile ? 'text-gray-700' : 'text-gray-400'}`}>
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
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
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

          {/* Option 2: Apply by phone (WhatsApp or Voice) - only show if at least one is available */}
          {hasPhoneOption && (
            <div className="flex flex-col rounded-xl border border-gray-200 p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                {hasWhatsApp && !hasVoice ? (
                  <MessageCircle className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                ) : (
                  <Phone className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {hasWhatsApp && !hasVoice 
                    ? 'Solliciteer via WhatsApp' 
                    : hasVoice && !hasWhatsApp 
                      ? 'Solliciteer via telefoon'
                      : 'Solliciteer via telefoon'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 grow">
                Geen CV, geen formulieren. Onze virtuele assistent begeleidt je en regelt de rest.
              </p>
              
              {/* Toggle between WhatsApp and Call - only show if both are available */}
              {hasBothPhoneOptions && (
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setPhoneContactMethod('whatsapp')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
                      setPhoneError(null); // Clear error on input change
                    }}
                    className="flex-1 text-gray-700 focus:outline-none bg-transparent"
                    placeholder="+32 XXX XX XX XX"
                  />
                </div>
                
                {/* Error message */}
                {phoneError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {phoneError}
                  </div>
                )}
                
                <button
                  onClick={() => handleSubmit(phoneContactMethod)}
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
      </AlertDialogContent>
    </AlertDialog>
  );
}

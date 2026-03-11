'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { initiateDocumentCollection } from '@/lib/pre-onboarding-api';
import type { JobType, NationalityStatus, DocumentType } from '@/lib/types';

interface TriggerOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  vacancyTitle: string;
  jobType: JobType;
}

// Random Dutch names for testing
const DUTCH_FIRST_NAMES = ['Jan', 'Pieter', 'Koen', 'Daan', 'Luuk', 'Bram', 'Lars', 'Sven', 'Thijs', 'Ruben', 'Eva', 'Lotte', 'Fleur', 'Sanne', 'Femke'];
const DUTCH_LAST_NAMES = ['de Jong', 'Jansen', 'de Vries', 'Bakker', 'Visser', 'Smit', 'Mulder', 'de Boer', 'Peters', 'Hendriks'];

function getRandomName() {
  const firstName = DUTCH_FIRST_NAMES[Math.floor(Math.random() * DUTCH_FIRST_NAMES.length)];
  const lastName = DUTCH_LAST_NAMES[Math.floor(Math.random() * DUTCH_LAST_NAMES.length)];
  return { firstName, lastName };
}

export function TriggerOnboardingDialog({
  open,
  onOpenChange,
  vacancyId,
  vacancyTitle,
  jobType,
}: TriggerOnboardingDialogProps) {
  const [randomName] = useState(() => getRandomName());
  const [firstName, setFirstName] = useState(randomName.firstName);
  const [lastName, setLastName] = useState(randomName.lastName);
  const [whatsappNumber, setWhatsappNumber] = useState('+32 487441391');
  const [nationality, setNationality] = useState<NationalityStatus>('belg');

  // Individual toggles for each document type
  const [requireIdCard, setRequireIdCard] = useState(true);
  const [requireBankAccount, setRequireBankAccount] = useState(true);
  const [requireWorkPermit, setRequireWorkPermit] = useState(false);
  const [requireDriverLicense, setRequireDriverLicense] = useState(false);
  const [requireMedical, setRequireMedical] = useState(jobType === 'arbeider');
  const [requireCertificates, setRequireCertificates] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build document list based on toggles
  const requiredDocTypes: DocumentType[] = [];
  if (requireIdCard) requiredDocTypes.push('id_card');
  if (requireBankAccount) requiredDocTypes.push('bank_account');
  if (requireWorkPermit) requiredDocTypes.push('work_permit');
  if (requireDriverLicense) requiredDocTypes.push('driver_license');
  if (requireMedical) requiredDocTypes.push('medical_certificate');
  if (requireCertificates) requiredDocTypes.push('certificate_diploma');

  const handleSubmit = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Vul alle velden in');
      return;
    }

    if (!whatsappNumber.trim() || !whatsappNumber.startsWith('+32')) {
      setError('Vul een geldig Belgisch telefoonnummer in (+32...)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await initiateDocumentCollection({
        vacancy_id: vacancyId,
        candidate_name: firstName,
        candidate_lastname: lastName,
        whatsapp_number: whatsappNumber.replace(/\s/g, ''), // Remove spaces
        documents: requiredDocTypes
      });

      toast.success('Documentcollectie gestart!', {
        description: `WhatsApp bericht verzonden naar ${firstName} ${lastName}`
      });

      // Reset form and close dialog
      const newRandomName = getRandomName();
      setFirstName(newRandomName.firstName);
      setLastName(newRandomName.lastName);
      setNationality('belg');
      setRequireIdCard(true);
      setRequireBankAccount(true);
      setRequireWorkPermit(false);
      setRequireDriverLicense(false);
      setRequireMedical(jobType === 'arbeider');
      setRequireCertificates(false);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to initiate document collection:', err);
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      toast.error('Fout bij het starten van document collectie');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleDialogClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <AlertDialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Documentcollectie starten
            </AlertDialogTitle>
            <button
              onClick={() => handleDialogClose(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {vacancyTitle}
          </p>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Candidate Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">Voornaam kandidaat</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jan"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Achternaam kandidaat</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Jansen"
            />
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp nummer</Label>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇧🇪</span>
              <Input
                id="whatsapp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+32 487 44 13 91"
              />
            </div>
            <p className="text-xs text-gray-500">
              Begin met +32 voor Belgische nummers
            </p>
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <Label>Nationaliteit</Label>
            <RadioGroup value={nationality} onValueChange={(val) => setNationality(val as NationalityStatus)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="belg" id="belg" />
                <Label htmlFor="belg" className="cursor-pointer font-normal">
                  Belg
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="niet-belg" id="niet-belg" />
                <Label htmlFor="niet-belg" className="cursor-pointer font-normal">
                  Niet-Belg (werkvergunning vereist)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Document Requirements - Manager has full control */}
          <div className="space-y-2">
            <Label>Te verzamelen documenten</Label>
            <p className="text-xs text-gray-500 mb-3">
              Schakel de documenten in/uit die je wilt verzamelen
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              {/* ID Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>📄</span>
                  <Label htmlFor="id-card" className="cursor-pointer font-normal">
                    Identiteitskaart
                  </Label>
                </div>
                <Switch
                  id="id-card"
                  checked={requireIdCard}
                  onCheckedChange={setRequireIdCard}
                />
              </div>

              {/* Bank Account */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>💳</span>
                  <Label htmlFor="bank-account" className="cursor-pointer font-normal">
                    Rekeningnummer
                  </Label>
                </div>
                <Switch
                  id="bank-account"
                  checked={requireBankAccount}
                  onCheckedChange={setRequireBankAccount}
                />
              </div>

              {/* Work Permit */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <Label htmlFor="work-permit" className="cursor-pointer font-normal">
                    Werkvergunning
                    {nationality === 'niet-belg' && (
                      <span className="ml-1 text-xs text-orange-600">(aanbevolen)</span>
                    )}
                  </Label>
                </div>
                <Switch
                  id="work-permit"
                  checked={requireWorkPermit}
                  onCheckedChange={setRequireWorkPermit}
                />
              </div>

              {/* Driver License */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🚗</span>
                  <Label htmlFor="driver-license" className="cursor-pointer font-normal">
                    Rijbewijs
                  </Label>
                </div>
                <Switch
                  id="driver-license"
                  checked={requireDriverLicense}
                  onCheckedChange={setRequireDriverLicense}
                />
              </div>

              {/* Medical Certificate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🏥</span>
                  <Label htmlFor="medical" className="cursor-pointer font-normal">
                    Medisch attest
                    {jobType === 'arbeider' && (
                      <span className="ml-1 text-xs text-orange-600">(aanbevolen)</span>
                    )}
                  </Label>
                </div>
                <Switch
                  id="medical"
                  checked={requireMedical}
                  onCheckedChange={setRequireMedical}
                />
              </div>

              {/* Certificates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🎓</span>
                  <Label htmlFor="certificates" className="cursor-pointer font-normal">
                    Certificaten & Diploma
                  </Label>
                </div>
                <Switch
                  id="certificates"
                  checked={requireCertificates}
                  onCheckedChange={setRequireCertificates}
                />
              </div>

              <div className="pt-2 mt-2 border-t border-gray-200 text-xs text-gray-500">
                Totaal: {requiredDocTypes.length} {requiredDocTypes.length === 1 ? 'document' : 'documenten'} geselecteerd
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            disabled={isSubmitting}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verzenden...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Verzoek verzenden
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

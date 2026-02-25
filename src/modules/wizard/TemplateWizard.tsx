"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { WIZARD_QUESTIONS, TEMPLATES, DEFAULT_TEMPLATE } from './wizardData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronRight, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function TemplateWizard() {
    const router = useRouter();
    const { loadProject } = useProjectStore();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Current Question
    const question = WIZARD_QUESTIONS[step];

    const handleAnswer = (value: string) => {
        setAnswers(prev => ({ ...prev, [question.id]: value }));
    };

    const handleNext = () => {
        if (step < WIZARD_QUESTIONS.length - 1) {
            setStep(prev => prev + 1);
        } else {
            generateProject();
        }
    };

    const generateProject = () => {
        const type = answers['type'] || 'webinar';
        const scale = answers['scale'] || 'plum';

        // Find template
        const typeGroup = TEMPLATES[type] || TEMPLATES['webinar']; // Fallback
        const template = typeGroup[scale] || DEFAULT_TEMPLATE;

        if (template === DEFAULT_TEMPLATE && !TEMPLATES[type]?.[scale]) {
            toast.warning("この組み合わせのテンプレートはまだありません。空のプロジェクトを作成します。");
        }

        // Hydrate Store
        loadProject({
            id: `proj-${Date.now()}`,
            projectName: `${type.toUpperCase()} - ${scale.toUpperCase()} Plan`,
            nodes: template.nodes,
            edges: template.edges,
            selectedEquipmentIds: template.equipmentIds,
            // Defaults
            startDate: new Date(),
            endDate: new Date(),
            setupDate: new Date(),
            clientName: '',
            venue: '',
            staffName: '',
            driveFolderId: '',
            driveFolderName: '',
            driveFileId: '',
            staff: [],
            schedule: [],
            additionalCosts: [],
            members: [],
            artboard: {
                enabled: false,
                size: 'A4',
                orientation: 'landscape'
            },
            discountAmount: 0,
            discountType: 'percent',
            discountIncludedCategories: ['staff', 'equipment', 'production'],
            editingEdgeId: null
        });

        toast.success("テンプレートからプロジェクトを作成しました！");
        router.push('/project');
    };

    if (!question) return <div>Error</div>;

    return (
        <div className="max-w-2xl mx-auto py-12">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                    <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Project Wizard</h2>
                <p className="text-muted-foreground">プロジェクトの要件を教えてください (Step {step + 1}/{WIZARD_QUESTIONS.length})</p>
            </div>

            <Card className="shadow-lg border-2 border-primary/10">
                <CardHeader>
                    <CardTitle className="text-xl text-center">{question.text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {question.options.map((option) => {
                        const isSelected = answers[question.id] === option.value;
                        return (
                            <div
                                key={option.value}
                                className={cn(
                                    "p-4 border-2 rounded-lg cursor-pointer transition-all flex items-center justify-between hover:border-primary/50",
                                    isSelected ? "border-primary bg-primary/5" : "border-muted"
                                )}
                                onClick={() => handleAnswer(option.value)}
                            >
                                <div>
                                    <div className="font-semibold">{option.label}</div>
                                    {option.description && (
                                        <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                                    )}
                                </div>
                                {isSelected && <Check className="w-5 h-5 text-primary" />}
                            </div>
                        );
                    })}
                </CardContent>
                <CardFooter className="flex justify-end pt-4">
                    <Button
                        onClick={handleNext}
                        disabled={!answers[question.id]}
                        className={cn("w-full sm:w-auto", !answers[question.id] && "opacity-50")}
                    >
                        {step === WIZARD_QUESTIONS.length - 1 ? 'プロジェクト作成' : '次へ'}
                        {step !== WIZARD_QUESTIONS.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

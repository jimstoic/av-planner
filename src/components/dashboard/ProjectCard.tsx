'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Calendar } from "lucide-react";

interface ProjectCardProps {
    project: any; // Type strictly later
}

export function ProjectCard({ project }: ProjectCardProps) {
    return (
        <Card className="w-80 shadow-lg border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.projectName}</CardTitle>
                    <Badge variant={project.status === 'confirmed' ? "default" : "secondary"}>
                        {project.status}
                    </Badge>
                </div>
                <CardDescription className="text-sm font-medium text-foreground">
                    {project.clientName}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{project.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{project.staffName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{project.startDate} - {project.endDate}</span>
                </div>
            </CardContent>
        </Card>
    );
}

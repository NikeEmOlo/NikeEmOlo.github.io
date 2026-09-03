import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./categories.js";

const projects = defineCollection({
    // watch this folder. One markdown file = one entry
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
    // Define the shape each project file MUST follow
    schema: z.object({
        order: z.number(),
        projTitle: z.string(),
        category: z.union([
            z.enum(CATEGORIES),
            z.array(z.enum(CATEGORIES)),
        ]),
        // The exact blurb written on the collectible card front
        summary: z.string(),
        // Controls whether the card is marked coming soon and unclickable or ready
        active: z.boolean().default(true),
        cardBg: z.string().default("#00B3E3"),
        borderColor: z.string().default("#007A99"),
        imageUrl: z.string().optional(),
        maskUrl: z.string().optional(),
        holoEffect: z.string().default("secret_rare_etched"),
        story: z.record(z.any()).optional(),
    }),
});

const cv = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cv" }),
    schema: z.object({
        name: z.string(),
        email: z.string().default("nike.emily@pm.me"),
        linkedin: z.string().default("https://www.linkedin.com/in/NikeEmilyO/"),
        pdfPath: z.string().default("/Olanike-Olowo-Fela-CV.pdf"),
        about: z.array(z.string()),
        education: z.object({
            degree: z.string(),
            school: z.string(),
            details: z.array(z.object({
                title: z.string(),
                description: z.string(),
            })),
        }),
        skills: z.array(z.object({
            name: z.string(),
            color: z.string().optional(),
        })),
        experience: z.array(z.object({
            company: z.string(),
            badge: z.string(),
            badgeColor: z.string().default("yellow"),
            location: z.string(),
            role: z.string(),
            keywords: z.string(),
            overview: z.string().optional(),
            bullets: z.array(z.string()),
        })),
        competencies: z.array(z.object({
            title: z.string(),
            code: z.string(),
            color: z.string().default("cyan"),
            items: z.array(z.string()),
        })),
        currently: z.array(z.object({
            title: z.string(),
            tag: z.string(),
            color: z.string().default("lime"),
            description: z.string(),
        })),
        certificates: z.array(z.object({
            title: z.string(),
            meta: z.string(),
            color: z.string().default("cyan"),
        })),
    }),
});

const home = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/home" }),
    schema: z.object({
        title: z.string().default("Olanike Olowo-Fela"),
        subtitle: z.string().default("I build systems and software that\nmake life easier."),
        projectsTitle: z.string().default("projects"),
        tickerLabel: z.string().default("Currently working on:"),
        currentlyWorkingOn: z.array(
            z.union([
                z.string(),
                z.object({
                    text: z.string(),
                    url: z.string().optional(),
                }),
            ])
        ).default([
            "Finishing this portfolio",
            "Finishing [The Odin Project](https://www.theodinproject.com/paths/full-stack-javascript) course in full-stack development so my AI agent doesn't think I'm an idiot",
        ]),
    }),
});

export const collections = { projects, cv, home };

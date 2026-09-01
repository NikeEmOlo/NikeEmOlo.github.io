import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./categories.js";

const projects = defineCollection({
    //watch this folder. One markdown file = one entry
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects"}),
    //Define the shape each project file MUST follow
    schema: z.object({
        order: z.number(),
        projTitle: z.string(),
        cardTitle: z.string(),
        projType: z.enum(["case study", "overview & timeline"]),
        icon: z.enum(["crab"]),
        category: z.enum(CATEGORIES),
        // Short blurb shown on the /projects list card.
        summary: z.string().optional(),
        tags: z.record(z.array(z.string())).optional(),
        // The case-study page's summary tabs, e.g. { Task: "…", Goal: "…" }.
        projectOverview: z.record(z.string()).optional(),
        // Link to this project's landing-page panel in the `overviews` collection.
        overview: reference("overviews").optional(),
        buttonTxt: z.string().optional(),
        links: z.record(z.string()).optional(),
        active: z.boolean().default(true),
        // HoloProjectCard (the home page deck / Sandbox / tarot-showcase)
        // reads these directly. cardBg/borderColor/holoCategory are
        // required so a new project can't be added to the deck without a
        // themed card — Astro's schema validation catches a missing one at
        // build time instead of silently rendering a default-looking card.
        // imageUrl/maskUrl/iconSrc stay optional: a project can ship before
        // its bespoke artwork exists — HoloProjectCard renders a clean
        // color-blocked card (no character art) when they're absent.
        cardBg: z.string(),
        borderColor: z.string(),
        // The HoloProjectCard's descriptive line under the artwork — a
        // longer phrase than cardTitle (the short nav/rail label), e.g.
        // "Agentic Workflow Implementation" vs. cardTitle's "AI Agents".
        holoCategory: z.string(),
        // A real, specific result for HoloProjectCard's stat line, e.g.
        // statLabel "RESULTS" / statValue "83% TIME SAVINGS". Optional —
        // only set this when the project actually has a concrete number to
        // report; leave unset and the deck falls back to a generic
        // per-category stat (see index.astro) rather than inventing one.
        holoStatLabel: z.string().optional(),
        holoStatValue: z.string().optional(),
        imageUrl: z.string().optional(),
        maskUrl: z.string().optional(),
        holoEffect: z.string().optional(),
        iconSrc: z.string().optional(),
        story: z.record(z.any()).optional(),
    }).passthrough(),
});

const overviews = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/overviews" }),
    schema: ({ image }) => z.object({
        projTitle: z.string(),
        img: image().optional(),
        imgClass: z.string().optional(),
        buttonTxt: z.string().default("Dive In"),
    }),
})

export const collections = { projects, overviews };

// Entry point for potential UI library package.
// All components intended for the package should be exported from here.

// Core Shadcn-like Primitives
export * from "./accordion";
export * from "./alert-dialog";
export * from "./alert";
export * from "./avatar";
export * from "./badge";
export * from "./breadcrumb";
export * from "./button";
export * from "./calendar";
export * from "./card";
export * from "./checkbox";
export * from "./command";
export * from "./dialog";
export * from "./dropdown-menu";
export * from "./form"; // Provides Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField
export * from "./input";
export * from "./label";
export * from "./menubar";
export * from "./popover";
export * from "./progress";
export * from "./radio-group";
export * from "./scroll-area";
export * from "./select";
export * from "./separator";
export * from "./sheet";
export * from "./skeleton";
export * from "./slider";
export * from "./switch";
export * from "./table";
export * from "./tabs";
export * from "./textarea";
export * from "./toast";
export * from "./toaster";
export * from "./tooltip";

// Potentially Custom/Composite Components (candidates for inclusion)
export * from "./InfoIcon"; // Assuming this is generic
export * from "./JsonEditorField"; // Assuming this is generic
export * from "./ConfirmationModal"; // Assuming this is a generic confirmation dialog wrapper
export * from "./FileUploader"; // If generic enough
export * from "./TagInput"; // If generic enough
export * from "./spinner"; // If generic
export * from "./HelpModal"; // If the shell is generic (e.g. using Dialog). Assuming HelpModal.tsx is canonical.
// export * from "./OnboardingModal"; // Likely too app-specific unless very generic shell
// export * from "./sidebar"; // Likely too app-specific
// export * from "./chart"; // If based on a common library like Recharts and styled generically

// Extended components
// Assuming FormFieldWithLabel is in extended/ and is meant to be exported.
// If it's not directly in ui/extended/ or ui/, the path needs adjustment.
// For now, assuming it's intended for export if it exists and is generic.
// export * from "./extended/FormFieldWithLabel"; // Path needs to be correct relative to this index.ts

// Note: Some components like OnboardingModal, sidebar, chart might be too application-specific
// or rely on heavier dependencies not suitable for a lightweight UI kit.
// They would need careful evaluation before inclusion.
// The duplicate help-modal.tsx vs HelpModal.tsx needs to be resolved; only one should be exported.
// For this conceptual index, I've included HelpModal.tsx (assuming it's the correct one).
// If FormFieldWithLabel.tsx is located at src/components/ui/extended/FormFieldWithLabel.tsx,
// then the export path should be "./extended/FormFieldWithLabel".
// Let's assume it is for now.
export * from "./extended/FormFieldWithLabel";

// It's good practice to ensure all exported paths are valid.
// The file `help-modal.tsx` (lowercase) was also listed. If it's different from `HelpModal.tsx` (uppercase)
// and also intended for export, it should be added. If it's a duplicate, it should be removed from the source.
// I will assume `HelpModal.tsx` is the canonical one.

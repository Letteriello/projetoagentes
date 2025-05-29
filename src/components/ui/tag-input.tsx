"use client";

import * as React from "react";
import { Input, InputProps } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  tags: string[];
  onTagsChange: (newTags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowDuplicates?: boolean;
  delimiters?: string[]; // e.g., [",", "Enter"]
  inputFieldPosition?: "top" | "bottom" | "inline";
  tagClassName?: string;
  inputWrapperClassName?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = "Adicionar tag...",
  maxTags,
  allowDuplicates = false,
  delimiters = ["Enter"],
  inputFieldPosition = "inline",
  tagClassName,
  inputWrapperClassName,
  className,
  ...restInputProps
}) => {
  const [inputValue, setInputValue] = React.useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addTag = (tagValue: string) => {
    const newTag = tagValue.trim();
    if (!newTag) return;
    if (!allowDuplicates && tags.includes(newTag)) return;
    if (maxTags && tags.length >= maxTags) return;

    onTagsChange([...tags, newTag]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (delimiters.includes(e.key)) {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const inputElement = (
    <Input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn("flex-grow", inputFieldPosition === "inline" ? "h-auto py-1 px-2 leading-tight" : "", className)}
      {...restInputProps}
      disabled={maxTags !== undefined && tags.length >= maxTags}
    />
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background", inputWrapperClassName)}>
      {inputFieldPosition === "top" && <div className="w-full mb-2">{inputElement}</div>}
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary" className={cn("flex items-center gap-1 whitespace-nowrap", tagClassName)}>
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remover ${tag}`}
            className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
          >
            <XIcon size={12} />
          </button>
        </Badge>
      ))}
      {inputFieldPosition === "inline" && inputElement}
      {inputFieldPosition === "bottom" && <div className="w-full mt-2">{inputElement}</div>}
    </div>
  );
};

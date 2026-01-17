"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function StyleguidePage() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const colors = [
    { name: "Background", var: "--background", fg: "--foreground" },
    { name: "Card", var: "--card", fg: "--card-foreground" },
    { name: "Popover", var: "--popover", fg: "--popover-foreground" },
    { name: "Primary", var: "--primary", fg: "--primary-foreground" },
    { name: "Secondary", var: "--secondary", fg: "--secondary-foreground" },
    { name: "Muted", var: "--muted", fg: "--muted-foreground" },
    { name: "Accent", var: "--accent", fg: "--accent-foreground" },
    { name: "Destructive", var: "--destructive", fg: "--destructive-foreground" },
  ];

  const semanticColors = [
    { name: "Success", var: "--success", fg: "--success-foreground" },
    { name: "Warning", var: "--warning", fg: "--warning-foreground" },
    { name: "Info", var: "--info", fg: "--info-foreground" },
  ];

  const chartColors = [
    { name: "Chart 1", var: "--chart-1" },
    { name: "Chart 2", var: "--chart-2" },
    { name: "Chart 3", var: "--chart-3" },
    { name: "Chart 4", var: "--chart-4" },
    { name: "Chart 5", var: "--chart-5" },
  ];

  const borderColors = [
    { name: "Border", var: "--border" },
    { name: "Input", var: "--input" },
    { name: "Ring", var: "--ring" },
  ];

  const radiusSizes = [
    { name: "Small", class: "rounded-sm", value: "calc(var(--radius) - 4px)" },
    { name: "Medium", class: "rounded-md", value: "calc(var(--radius) - 2px)" },
    { name: "Large", class: "rounded-lg", value: "var(--radius)" },
    { name: "Extra Large", class: "rounded-xl", value: "calc(var(--radius) + 4px)" },
  ];

  const shadows = [
    { name: "2XS", var: "--shadow-2xs" },
    { name: "XS", var: "--shadow-xs" },
    { name: "SM", var: "--shadow-sm" },
    { name: "Default", var: "--shadow" },
    { name: "MD", var: "--shadow-md" },
    { name: "LG", var: "--shadow-lg" },
    { name: "XL", var: "--shadow-xl" },
    { name: "2XL", var: "--shadow-2xl" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Design Tokens</h1>
            <p className="text-muted-foreground">
              Complete design system foundation for GymRats
            </p>
          </div>
          <Button onClick={toggleTheme} variant="outline">
            {isDark ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </div>

      {/* Color Palette */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Color Palette</h2>

        <h3 className="text-xl font-semibold mb-4">System Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {colors.map((color) => (
            <Card key={color.name}>
              <CardContent className="p-0">
                <div
                  className="h-32 rounded-t-lg flex items-center justify-center"
                  style={{
                    background: `var(${color.var})`,
                    color: `var(${color.fg})`,
                  }}
                >
                  <span className="font-semibold">{color.name}</span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground font-mono">{color.var}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.fg}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="text-xl font-semibold mb-4">Semantic Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {semanticColors.map((color) => (
            <Card key={color.name}>
              <CardContent className="p-0">
                <div
                  className="h-32 rounded-t-lg flex items-center justify-center"
                  style={{
                    background: `var(${color.var})`,
                    color: `var(${color.fg})`,
                  }}
                >
                  <span className="font-semibold">{color.name}</span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground font-mono">{color.var}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.fg}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="text-xl font-semibold mb-4">Chart Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {chartColors.map((color) => (
            <Card key={color.name}>
              <CardContent className="p-0">
                <div
                  className="h-24 rounded-t-lg"
                  style={{
                    background: `var(${color.var})`,
                  }}
                />
                <div className="p-3">
                  <p className="text-sm font-medium mb-1">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.var}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="text-xl font-semibold mb-4">Border & Input Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {borderColors.map((color) => (
            <Card key={color.name}>
              <CardContent className="p-6">
                <div
                  className="h-16 rounded border-4 mb-3"
                  style={{
                    borderColor: `var(${color.var})`,
                  }}
                />
                <p className="text-sm font-medium mb-1">{color.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{color.var}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Typography</h2>
        <Card>
          <CardContent className="p-8 space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Headings</p>
              <h1 className="text-5xl font-bold mb-2">Heading 1</h1>
              <h2 className="text-4xl font-bold mb-2">Heading 2</h2>
              <h3 className="text-3xl font-semibold mb-2">Heading 3</h3>
              <h4 className="text-2xl font-semibold mb-2">Heading 4</h4>
              <h5 className="text-xl font-medium mb-2">Heading 5</h5>
              <h6 className="text-lg font-medium">Heading 6</h6>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Body Text</p>
              <p className="text-base mb-2">
                This is regular body text using Poppins font. It's designed for readability
                and comfort during extended reading sessions.
              </p>
              <p className="text-sm mb-2">
                This is small text, often used for captions and secondary information.
              </p>
              <p className="text-xs">
                This is extra small text, typically for metadata or fine print.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Font Families</p>
              <p className="font-sans mb-2">Sans-serif: Poppins (Primary)</p>
              <p className="font-serif mb-2" style={{ fontFamily: "var(--font-serif)" }}>
                Serif: Libre Baskerville
              </p>
              <p className="font-mono" style={{ fontFamily: "var(--font-mono)" }}>
                Monospace: IBM Plex Mono
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Border Radius */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Border Radius</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {radiusSizes.map((radius) => (
            <Card key={radius.name}>
              <CardContent className="p-6">
                <div
                  className={`h-24 bg-primary ${radius.class} mb-3`}
                />
                <p className="text-sm font-medium mb-1">{radius.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{radius.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Shadows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {shadows.map((shadow) => (
            <Card key={shadow.name}>
              <CardContent className="p-6">
                <div
                  className="h-24 bg-card rounded-lg mb-3"
                  style={{
                    boxShadow: `var(${shadow.var})`,
                  }}
                />
                <p className="text-sm font-medium mb-1">{shadow.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{shadow.var}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Components */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6">Components</h2>

        <div className="space-y-8">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Button variants using design tokens</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Badge variants for labels and tags</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>Alert components for notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>
                  This is a default alert using the design system colors.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Error Alert</AlertTitle>
                <AlertDescription>
                  This is a destructive alert for errors and warnings.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Radio Group */}
          <Card>
            <CardHeader>
              <CardTitle>Radio Group</CardTitle>
              <CardDescription>Radio button selection</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="option-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-1" id="option-1" />
                  <Label htmlFor="option-1">Option 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-2" id="option-2" />
                  <Label htmlFor="option-2">Option 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-3" id="option-3" />
                  <Label htmlFor="option-3">Option 3</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>Card component examples</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">This is a card with content using the design tokens.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Another Card</CardTitle>
                  <CardDescription>With more information</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Cards can contain any content you need.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Third Card</CardTitle>
                  <CardDescription>Demonstrating consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">All using the same design system.</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

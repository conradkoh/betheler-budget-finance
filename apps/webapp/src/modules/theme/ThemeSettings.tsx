'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/modules/theme/ThemeProvider';

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
    toast.success(`Theme changed to ${newTheme}`);
  };

  return (
    <div className="border-t pt-6">
      <h2 className="text-xl font-semibold mb-2">Theme Preferences</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Choose your preferred theme for the application. The system theme will automatically switch
        between light and dark based on your device settings.
      </p>

      <RadioGroup
        value={theme}
        onValueChange={handleThemeChange}
        className="grid gap-4 md:grid-cols-3"
      >
        <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50">
          <RadioGroupItem value="light" id="theme-light" />
          <Label htmlFor="theme-light" className="flex flex-1 items-center gap-2 cursor-pointer">
            <Sun className="h-5 w-5" />
            <div>
              <div className="font-medium">Light Theme</div>
              <div className="text-sm text-muted-foreground">Always use light mode</div>
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50">
          <RadioGroupItem value="dark" id="theme-dark" />
          <Label htmlFor="theme-dark" className="flex flex-1 items-center gap-2 cursor-pointer">
            <Moon className="h-5 w-5" />
            <div>
              <div className="font-medium">Dark Theme</div>
              <div className="text-sm text-muted-foreground">Always use dark mode</div>
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50">
          <RadioGroupItem value="system" id="theme-system" />
          <Label htmlFor="theme-system" className="flex flex-1 items-center gap-2 cursor-pointer">
            <Laptop className="h-5 w-5" />
            <div>
              <div className="font-medium">System Theme</div>
              <div className="text-sm text-muted-foreground">Follow system settings</div>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}

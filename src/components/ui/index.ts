// UI Components - Existing
export { Button } from './Button';
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent } from './Card';
export { Input } from './Input';
export { Modal } from './Modal';
export { Loading, Spinner } from './Loading';
export { Alert, AlertTitle, AlertDescription } from './Alert';
export { showNotification, useNotification } from './Notification';
export { Table } from './Table';

// UI Components - New Radix-based components
export { ButtonRadix, buttonVariants } from './button-radix';
export { Badge, badgeVariants } from './badge';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Progress } from './progress';
export { Separator } from './separator';
export { ScrollArea, ScrollBar } from './scroll-area';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
export { Textarea } from './textarea';
export { Switch } from './switch';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog';
export { Label } from './label';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { default as ImageViewer } from './ImageViewer';
export { default as DicomViewer } from './DicomViewer';
export { default as AiAnalysisViewer } from './AiAnalysisViewer';

// Types
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
export type { InputProps } from './Input';
export type { ModalProps } from './Modal';
export type { AlertProps } from './Alert';
export type { TableProps } from './Table';

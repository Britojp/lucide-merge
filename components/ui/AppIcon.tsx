import React, { type ComponentProps, type ComponentType } from 'react';
import { X } from 'lucide-react-native';

export const appIconStroke = 1.65;

export type AppLucideIcon = ComponentType<ComponentProps<typeof X>>;

type AppIconProps = ComponentProps<typeof X> & {
  icon: AppLucideIcon;
};

export function AppIcon({
  icon: Icon,
  size = 22,
  color,
  strokeWidth = appIconStroke,
  ...rest
}: AppIconProps) {
  return <Icon size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
}

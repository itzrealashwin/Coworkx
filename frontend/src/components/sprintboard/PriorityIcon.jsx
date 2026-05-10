import React from 'react';
import { cn } from '@/lib/utils';
import { PRIORITY_CONFIG } from './utils/constants';

const PriorityIcon = React.memo(({ priority }) => {
	const config = PRIORITY_CONFIG[String(priority || '').toLowerCase()] || PRIORITY_CONFIG.medium;
	const Icon = config.icon;

	return <Icon className={cn('size-3.5 shrink-0', config.iconClass)} />;
});

PriorityIcon.displayName = 'PriorityIcon';

export default PriorityIcon;

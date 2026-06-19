import * as Icons from 'lucide-react';

export default function DynamicIcon({ name, size = 24 }) {
    const Icon = Icons[name];

    return Icon ? <Icon size={size} /> : null;
}

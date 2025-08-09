'use client';

import { APP_VERSION } from '@/lib/version';

interface VersionDisplayProps {
  className?: string;
  showCommitHash?: boolean;
  showEnvironment?: boolean;
  showFullVersion?: boolean;
}

export function VersionDisplay({ 
  className = '', 
  showCommitHash = false,
  showEnvironment = true,
  showFullVersion = false
}: VersionDisplayProps) {
  const versionText = showFullVersion 
    ? APP_VERSION.fullVersion
    : showCommitHash 
      ? `v${APP_VERSION.version}+${APP_VERSION.commitHash}`
      : `v${APP_VERSION.version}`;

  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      <span>{versionText}</span>
      {showEnvironment && APP_VERSION.environment !== 'production' && (
        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
          {APP_VERSION.environment}
        </span>
      )}
      {APP_VERSION.isRelease && (
        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
          release
        </span>
      )}
    </div>
  );
}
import { useState } from 'react';
import { MoreHorizontal, Link2, UserPlus, UserMinus, VolumeX, Volume2, Flag } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsFollowing, useFollow, useUnfollow } from '@/hooks/useFollows';
import { useIsMuted, useMute, useUnmute } from '@/hooks/useMuteList';
import { useReport } from '@/hooks/useReport';
import { useToast } from '@/hooks/useToast';
import { getPostDen } from '@/lib/foxhole';

interface PostOverflowMenuProps {
  post: NostrEvent;
  className?: string;
}

/**
 * 3-dot overflow menu for posts with share, follow, mute, and report actions.
 */
export function PostOverflowMenu({ post, className }: PostOverflowMenuProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [showReportDialog, setShowReportDialog] = useState(false);

  const isOwnPost = user?.pubkey === post.pubkey;
  const isFollowing = useIsFollowing(post.pubkey);
  const isMuted = useIsMuted(post.pubkey);

  const { mutate: follow, isPending: isFollowPending } = useFollow();
  const { mutate: unfollow, isPending: isUnfollowPending } = useUnfollow();
  const { mutate: mute, isPending: isMutePending } = useMute();
  const { mutate: unmute, isPending: isUnmutePending } = useUnmute();
  const { mutate: report, isPending: isReportPending } = useReport();

  const den = getPostDen(post);
  const postUrl = den ? `/d/${den}/post/${post.id}` : null;

  const handleCopyLink = () => {
    const fullUrl = postUrl ? `${window.location.origin}${postUrl}` : window.location.href;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: 'Link copied to clipboard' });
  };

  const handleFollow = () => {
    follow(post.pubkey, {
      onSuccess: () => toast({ title: 'Followed', description: 'User added to your follow list' }),
      onError: () => toast({ title: 'Error', description: 'Failed to follow user', variant: 'destructive' }),
    });
  };

  const handleUnfollow = () => {
    unfollow(post.pubkey, {
      onSuccess: () => toast({ title: 'Unfollowed', description: 'User removed from your follow list' }),
      onError: () => toast({ title: 'Error', description: 'Failed to unfollow user', variant: 'destructive' }),
    });
  };

  const handleMute = () => {
    mute(post.pubkey, {
      onSuccess: () => toast({ title: 'Muted', description: 'User has been muted' }),
      onError: () => toast({ title: 'Error', description: 'Failed to mute user', variant: 'destructive' }),
    });
  };

  const handleUnmute = () => {
    unmute(post.pubkey, {
      onSuccess: () => toast({ title: 'Unmuted', description: 'User has been unmuted' }),
      onError: () => toast({ title: 'Error', description: 'Failed to unmute user', variant: 'destructive' }),
    });
  };

  const handleReport = () => {
    report(
      { eventId: post.id, pubkey: post.pubkey, reportType: 'spam' },
      {
        onSuccess: () => {
          toast({ title: 'Reported', description: 'Post has been reported' });
          setShowReportDialog(false);
        },
        onError: () => toast({ title: 'Error', description: 'Failed to report post', variant: 'destructive' }),
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 text-muted-foreground hover:text-foreground ${className || ''}`}
            aria-label="Post options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Share link - always available */}
          <DropdownMenuItem onClick={handleCopyLink}>
            <Link2 className="h-4 w-4 mr-2" />
            Copy link
          </DropdownMenuItem>

          {/* Follow/Unfollow - only when logged in and not own post */}
          {user && !isOwnPost && (
            <>
              <DropdownMenuSeparator />
              {isFollowing ? (
                <DropdownMenuItem onClick={handleUnfollow} disabled={isUnfollowPending}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unfollow author
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleFollow} disabled={isFollowPending}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow author
                </DropdownMenuItem>
              )}

              {/* Mute/Unmute */}
              {isMuted ? (
                <DropdownMenuItem onClick={handleUnmute} disabled={isUnmutePending}>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Unmute author
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleMute} disabled={isMutePending}>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Mute author
                </DropdownMenuItem>
              )}

              {/* Report */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowReportDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Flag className="h-4 w-4 mr-2" />
                Report post
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report confirmation dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will publish a report event to your relays. Reports help the community identify
              problematic content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReport}
              disabled={isReportPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isReportPending ? 'Reporting...' : 'Report'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

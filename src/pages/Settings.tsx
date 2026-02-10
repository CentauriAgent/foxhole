import { useState, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { Loader2, Plus, Trash2, Server, Radio, Wallet } from 'lucide-react';
import { SiteHeader, Sidebar } from '@/components/foxhole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';

interface RelayEntry {
  url: string;
  read: boolean;
  write: boolean;
}

interface BlossomServer {
  url: string;
}

export default function Settings() {
  const { user, metadata } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  // Relay state
  const [relays, setRelays] = useState<RelayEntry[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const [relaysLoading, setRelaysLoading] = useState(false);

  // Blossom state
  const [blossomServers, setBlossomServers] = useState<BlossomServer[]>([]);
  const [newBlossomUrl, setNewBlossomUrl] = useState('');
  const [blossomLoading, setBlossomLoading] = useState(false);

  // NWC state
  const [nwcString, setNwcString] = useState('');
  const [nwcSaved, setNwcSaved] = useState(false);

  // Load relay list
  useEffect(() => {
    if (!user) return;
    setRelaysLoading(true);
    nostr.query([{ kinds: [10002], authors: [user.pubkey], limit: 1 }])
      .then((events) => {
        if (events.length > 0) {
          const entries: RelayEntry[] = [];
          for (const tag of events[0].tags) {
            if (tag[0] === 'r' && tag[1]) {
              const marker = tag[2];
              entries.push({
                url: tag[1],
                read: !marker || marker === 'read',
                write: !marker || marker === 'write',
              });
            }
          }
          setRelays(entries);
        }
      })
      .catch(console.error)
      .finally(() => setRelaysLoading(false));
  }, [user, nostr]);

  // Load blossom servers
  useEffect(() => {
    if (!user) return;
    setBlossomLoading(true);
    nostr.query([{ kinds: [10063], authors: [user.pubkey], limit: 1 }])
      .then((events) => {
        if (events.length > 0) {
          const servers: BlossomServer[] = [];
          for (const tag of events[0].tags) {
            if (tag[0] === 'server' && tag[1]) {
              servers.push({ url: tag[1] });
            }
          }
          setBlossomServers(servers);
        }
      })
      .catch(console.error)
      .finally(() => setBlossomLoading(false));
  }, [user, nostr]);

  // Load NWC from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('foxhole:nwc');
    if (saved) {
      setNwcString(saved);
      setNwcSaved(true);
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container py-6">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Please log in to access settings.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Relay handlers
  const addRelay = () => {
    const url = newRelayUrl.trim();
    if (!url || !url.startsWith('wss://')) {
      toast({ title: 'Invalid URL', description: 'Relay URL must start with wss://', variant: 'destructive' });
      return;
    }
    if (relays.some((r) => r.url === url)) {
      toast({ title: 'Duplicate', description: 'This relay is already in your list', variant: 'destructive' });
      return;
    }
    setRelays([...relays, { url, read: true, write: true }]);
    setNewRelayUrl('');
  };

  const removeRelay = (url: string) => {
    setRelays(relays.filter((r) => r.url !== url));
  };

  const toggleRelay = (url: string, field: 'read' | 'write') => {
    setRelays(relays.map((r) => {
      if (r.url === url) {
        const updated = { ...r, [field]: !r[field] };
        // Must have at least one of read/write
        if (!updated.read && !updated.write) return r;
        return updated;
      }
      return r;
    }));
  };

  const saveRelays = async () => {
    const tags = relays.map((r) => {
      if (r.read && r.write) return ['r', r.url];
      if (r.read) return ['r', r.url, 'read'];
      return ['r', r.url, 'write'];
    });
    try {
      await publishEvent({ kind: 10002, content: '', tags, created_at: Math.floor(Date.now() / 1000) });
      toast({ title: 'Saved', description: 'Relay list updated' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save relay list', variant: 'destructive' });
    }
  };

  // Blossom handlers
  const addBlossom = () => {
    const url = newBlossomUrl.trim();
    if (!url || !url.startsWith('https://')) {
      toast({ title: 'Invalid URL', description: 'Blossom server URL must start with https://', variant: 'destructive' });
      return;
    }
    if (blossomServers.some((s) => s.url === url)) {
      toast({ title: 'Duplicate', description: 'This server is already in your list', variant: 'destructive' });
      return;
    }
    setBlossomServers([...blossomServers, { url }]);
    setNewBlossomUrl('');
  };

  const removeBlossom = (url: string) => {
    setBlossomServers(blossomServers.filter((s) => s.url !== url));
  };

  const saveBlossom = async () => {
    const tags = blossomServers.map((s) => ['server', s.url]);
    try {
      await publishEvent({ kind: 10063, content: '', tags, created_at: Math.floor(Date.now() / 1000) });
      toast({ title: 'Saved', description: 'Blossom server list updated' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save Blossom servers', variant: 'destructive' });
    }
  };

  // NWC handlers
  const saveNwc = () => {
    const trimmed = nwcString.trim();
    if (trimmed && !trimmed.startsWith('nostr+walletconnect://')) {
      toast({ title: 'Invalid', description: 'NWC string must start with nostr+walletconnect://', variant: 'destructive' });
      return;
    }
    if (trimmed) {
      localStorage.setItem('foxhole:nwc', trimmed);
      setNwcSaved(true);
      toast({ title: 'Saved', description: 'NWC connection saved' });
    }
  };

  const disconnectNwc = () => {
    localStorage.removeItem('foxhole:nwc');
    setNwcString('');
    setNwcSaved(false);
    toast({ title: 'Disconnected', description: 'NWC wallet disconnected' });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Settings</h1>

            <Tabs defaultValue="relays" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
                <TabsTrigger value="relays" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--brand))] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2">
                  <Radio className="h-4 w-4" /> Relays
                </TabsTrigger>
                <TabsTrigger value="blossom" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--brand))] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2">
                  <Server className="h-4 w-4" /> Media Servers
                </TabsTrigger>
                <TabsTrigger value="nwc" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--brand))] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2">
                  <Wallet className="h-4 w-4" /> Wallet
                </TabsTrigger>
              </TabsList>

              {/* Relay Settings */}
              <TabsContent value="relays" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Relay Settings (NIP-65)</CardTitle>
                    <CardDescription>Manage your preferred Nostr relays for reading and writing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relaysLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : (
                      <>
                        {relays.length === 0 && (
                          <p className="text-sm text-muted-foreground">No relays configured. Add one below.</p>
                        )}
                        {relays.map((relay) => (
                          <div key={relay.url} className="p-3 rounded-lg border border-border space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-sm font-mono truncate min-w-0">{relay.url}</p>
                              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeRelay(relay.url)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Switch checked={relay.read} onCheckedChange={() => toggleRelay(relay.url, 'read')} />
                                <Label className="text-xs">Read</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch checked={relay.write} onCheckedChange={() => toggleRelay(relay.url, 'write')} />
                                <Label className="text-xs">Write</Label>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder="wss://relay.example.com"
                            value={newRelayUrl}
                            onChange={(e) => setNewRelayUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addRelay()}
                          />
                          <Button variant="outline" onClick={addRelay}>
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        <Button onClick={saveRelays} disabled={isPending}>
                          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Relay List
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Blossom Settings */}
              <TabsContent value="blossom" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Blossom Media Servers</CardTitle>
                    <CardDescription>Manage your Blossom media servers for file uploads (BUD-03).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {blossomLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : (
                      <>
                        {blossomServers.length === 0 && (
                          <p className="text-sm text-muted-foreground">No Blossom servers configured. Default: <span className="font-mono">blossom.primal.net</span></p>
                        )}
                        {blossomServers.map((server) => (
                          <div key={server.url} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                            <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                            <p className="flex-1 text-sm font-mono truncate">{server.url}</p>
                            <Button variant="ghost" size="icon" onClick={() => removeBlossom(server.url)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://blossom.primal.net/"
                            value={newBlossomUrl}
                            onChange={(e) => setNewBlossomUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addBlossom()}
                          />
                          <Button variant="outline" onClick={addBlossom}>
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        <Button onClick={saveBlossom} disabled={isPending}>
                          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Server List
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* NWC Settings */}
              <TabsContent value="nwc" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Nostr Wallet Connect</CardTitle>
                    <CardDescription>Connect your Lightning wallet for zapping.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metadata?.lud16 && (
                      <div className="p-3 rounded-lg border border-border">
                        <Label className="text-xs text-muted-foreground">Lightning Address (from profile)</Label>
                        <p className="text-sm font-mono mt-1">{metadata.lud16}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>NWC Connection String</Label>
                      <Input
                        placeholder="nostr+walletconnect://..."
                        value={nwcString}
                        onChange={(e) => { setNwcString(e.target.value); setNwcSaved(false); }}
                        type="password"
                      />
                    </div>
                    {nwcSaved ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-green-600 dark:text-green-400">✓ Wallet connected</span>
                        <Button variant="destructive" size="sm" onClick={disconnectNwc}>Disconnect</Button>
                      </div>
                    ) : (
                      <Button onClick={saveNwc} disabled={!nwcString.trim()}>Save Connection</Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Get an NWC connection string from your wallet provider (e.g., Alby, Mutiny). 
                      Zap functionality will use this connection for sending payments.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
}

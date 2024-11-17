import {useState} from 'react';
import {Github, Globe, Settings} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {PullRequest} from "@/models/PullRequest.tsx";
import {PullRequestItem} from "@/components/PullRequestItem.tsx";

// Datos de ejemplo para mockear
const mockPRs: PullRequest[] = [
    new PullRequest(
        "1", // ID
        "github", // Plataforma
        1, // Número del PR
        "Feature ETP-321: Fix pydantic issues", // Título
        "etendosoftware/com.etendoerp.copilot.toolpack", // Repositorio
        {checks: "pass", mergeable: true, review: "waiting"}, // Estado
        "Checks Pass", // Checks Status
        true, // Mergeable
        "Waiting for review", // Review Status
        {additions: 100, deletions: 20, commits: 5}, // Cambios
        {
            name: "valenvivaldi",
            avatarUrl: "https://avatars.githubusercontent.com/u/17523777?s=96&v=4"
        }, // Autor
        "https://github.com/etendosoftware/com.etendoerp.copilot.toolpack/pull/1" // Link
    ),
    new PullRequest(
        "2", // ID
        "github", // Plataforma
        3, // Número del PR
        "Feature ETP-660: Improve tools", // Título
        "etendosoftware/com.etendoerp.copilot.toolpack", // Repositorio
        {checks: "pass", mergeable: true, review: "waiting"}, // Estado
        "Checks Pass", // Checks Status
        true, // Mergeable
        "Waiting for review", // Review Status
        {additions: 615, deletions: 407, commits: 23}, // Cambios
        {
            name: "valenvivaldi",
            avatarUrl: "https://avatars.githubusercontent.com/u/17523777?s=96&v=4"
        }, // Autor
        "https://github.com/etendosoftware/com.etendoerp.copilot.toolpack/pull/3" // Link
    ),
    new PullRequest(
        "3", // ID
        "bitbucket", // Plataforma
        45, // Número del PR
        "BB-123: Update authentication flow", // Título
        "etendosoftware/billing-service", // Repositorio
        {checks: "pass", mergeable: true, review: "waiting"}, // Estado
        "Checks Pass", // Checks Status
        true, // Mergeable
        "Waiting for review", // Review Status
        {additions: 215, deletions: 107, commits: 13}, // Cambios
        {
            name: "developer2",
            avatarUrl: "https://bitbucket.org/account/avatar"
        }, // Autor
        "https://bitbucket.org/etendosoftware/billing-service/pull-requests/45" // Link
    )];

const PullRequestList = () => {
    const [platform, setPlatform] = useState('all');
    const [prs] = useState(mockPRs);

    const [tokens, setTokens] = useState({
        github: '',
        bitbucket: ''
    });
    const [showSettings, setShowSettings] = useState(false);

    const handleTokenUpdate = (platform: string, value: string) => {
        setTokens(prev => ({
            ...prev,
            [platform]: value
        }));
    };

    const handleSaveSettings = () => {
        // Aquí iría la lógica para guardar los tokens
        console.log('Tokens saved:', tokens);
        setShowSettings(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pass':
                return 'bg-green-500';
            case 'fail':
                return 'bg-red-500';
            case 'waiting':
                return 'bg-blue-400';
            default:
                return 'bg-gray-400';
        }
    };

    const filteredPRs = platform === 'all'
        ? prs
        : prs.filter(pr => pr.platform === platform);

    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Pull Requests</CardTitle>
                    <div className="flex items-center space-x-4">
                        <div className="flex space-x-2">
                            <Button
                                variant={platform === 'all' ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPlatform('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={platform === 'github' ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPlatform('github')}
                            >
                                <Github className="w-4 h-4 mr-2"/>
                                GitHub
                            </Button>
                            <Button
                                variant={platform === 'bitbucket' ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPlatform('bitbucket')}
                            >
                                <Globe className="w-4 h-4 mr-2"/>
                                Bitbucket
                            </Button>
                        </div>
                        <Dialog open={showSettings} onOpenChange={setShowSettings}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Settings className="w-5 h-5"/>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Platform Settings</DialogTitle>
                                    <DialogDescription>
                                        Configure your GitHub and Bitbucket access tokens
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="github-token">GitHub Token</Label>
                                        <Input
                                            id="github-token"
                                            type="password"
                                            placeholder="Enter your GitHub token"
                                            value={tokens.github}
                                            onChange={(e) => handleTokenUpdate('github', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bitbucket-token">Bitbucket Token</Label>
                                        <Input
                                            id="bitbucket-token"
                                            type="password"
                                            placeholder="Enter your Bitbucket token"
                                            value={tokens.bitbucket}
                                            onChange={(e) => handleTokenUpdate('bitbucket', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setShowSettings(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveSettings}>
                                        Save Settings
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <Tabs defaultValue="incoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="incoming">
                            Incoming PRs <span className="ml-2 bg-red-500 text-white rounded-full px-2">2</span>
                        </TabsTrigger>
                        <TabsTrigger value="muted">
                            Muted <span className="ml-2 bg-gray-500 text-white rounded-full px-2">0</span>
                        </TabsTrigger>
                        <TabsTrigger value="reviewed">
                            Already reviewed <span className="ml-2 bg-gray-500 text-white rounded-full px-2">2</span>
                        </TabsTrigger>
                        <TabsTrigger value="mine">
                            My PRs <span className="ml-2 bg-gray-500 text-white rounded-full px-2">11</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="incoming">
                        <CardContent>
                            <div className="space-y-4">
                                {filteredPRs.map((pr: PullRequest) => (
                                    <PullRequestItem key={pr.id} pr={pr}
                                                     statusColor={getStatusColor(pr.status.checks)}/>
                                ))}
                            </div>
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </CardHeader>
        </Card>
    );
};

export default PullRequestList;
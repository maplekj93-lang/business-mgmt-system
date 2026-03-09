const { execSync } = require('child_process');
const readline = require('readline');

// 콘솔 색상 설정
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgRed: "\x1b[31m",
    fgCyan: "\x1b[36m"
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const runCommand = (command, options = {}) => {
    try {
        console.log(`${colors.fgCyan}> ${command}${colors.reset}`);
        execSync(command, { stdio: 'inherit', ...options });
        return true;
    } catch (error) {
        console.error(`${colors.fgRed}❌ 명령어 실행 실패: ${command}${colors.reset}`);
        return false;
    }
};

const getCommandOutput = (command) => {
    try {
        return execSync(command, { stdio: 'pipe' }).toString().trim();
    } catch (error) {
        return null;
    }
};

async function main() {
    console.log(`\n${colors.bright}${colors.fgGreen}=== 🚀 Business Mgmt System - GitHub 편의 백업 스크립트 ===${colors.reset}\n`);

    // 1. 현재 git 상태 확인
    const statusOutput = getCommandOutput('git status --porcelain');
    if (!statusOutput) {
        console.log(`${colors.fgYellow}ℹ️ 변경된 파일이 없습니다. 커밋/푸시를 생략합니다.${colors.reset}\n`);
        process.exit(0);
    }

    // 2. 현재 원격(Remote) 저장소 확인
    const originUrl = getCommandOutput('git remote get-url origin');

    if (!originUrl) {
        console.log(`${colors.fgYellow}⚠️ 연동된 원격 저장소(origin)가 없습니다.${colors.reset}`);
        console.log(`GitHub에 방문하여 빈 Repository를 1개 생성한 뒤, 아래에 저장소 URL을 입력해주세요.`);
        console.log(`(예: https://github.com/USERNAME/business-mgmt-system.git)`);

        await new Promise((resolve) => {
            rl.question(`\n저장소 URL 입력 (건너뛰려면 Enter): `, (repoUrl) => {
                if (repoUrl.trim()) {
                    runCommand(`git remote add origin ${repoUrl}`);
                    console.log(`${colors.fgGreen}✅ 원격 저장소 등록 완료: ${repoUrl}${colors.reset}\n`);
                } else {
                    console.log(`${colors.fgRed}❌ 원격 저장소 URL이 입력되지 않아 백업을 중단합니다.${colors.reset}\n`);
                    process.exit(1);
                }
                resolve();
            });
        });
    } else {
        console.log(`${colors.fgGreen}✅ 원격 저장소 확인 됨: ${originUrl}${colors.reset}\n`);
    }

    // 3. 커밋 메시지 입력 (기본값 제공)
    const today = new Date();
    const defaultMessage = `chore(backup): 자동 백업 - ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    rl.question(`${colors.bright}백업 커밋 메시지를 입력하세요:${colors.reset} [${defaultMessage}] `, (inputMsg) => {
        const commitMsg = inputMsg.trim() || defaultMessage;

        console.log(`\n${colors.fgCyan}--- 백업 진행 시작 ---${colors.reset}`);

        // 4. Git add, commit, push 일괄 실행
        if (runCommand('git add .')) {
            if (runCommand(`git commit -m "${commitMsg}"`)) {
                // branch가 main인지 master인지 확인 후 push
                const branchName = getCommandOutput('git rev-parse --abbrev-ref HEAD') || 'main';

                if (runCommand(`git push -u origin ${branchName}`)) {
                    console.log(`\n${colors.bright}${colors.fgGreen}🎉 GitHub 백업이 성공적으로 완료되었습니다!${colors.reset}\n`);
                }
            }
        }

        rl.close();
    });
}

main();

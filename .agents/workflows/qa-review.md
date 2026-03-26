---
description: Run a final QA and code review pipeline (QA/Release Engineer persona) after coding is complete.
---
# /qa-review Workflow (QA & Release Engineer Persona)

**목적 (Purpose):**
작업된 코드가 실제 프로덕션 환경에서 오류 없이 동작하는지, UI/UX 결함이 없는지, 기존 코딩 규칙을 어기지 않았는지 **QA 전문 엔지니어의 관점**에서 검증합니다.

## 실행 절차 (Execution Steps):

1. **기계적 빌드/타입 검사 (Mechanical Lint & Build):**
   - `npm x tsc --noEmit` 명령어를 실행하여 타입 에러가 한 건도 없는지 확인합니다.
   - `npm run build`를 통해 빌드 과정에 구문 오류가 없는지 파악합니다.

2. **Self Code Review (안티패턴 탐지):**
   - 이번 작업 분량에 대해 다음 규정 위반이 있는지 스스로 스캔합니다.
     - 하드코딩된 색상 클래스 존재 여부 (예: `bg-white`)
     - `any`, `as any`, 무분별한 `unknown` 사용 여부
     - Server action 내부에서 `throw error` 패턴 사용 여부
     - Deep import 위반 여부 (예: `import ... from '@/features/xyz/ui/abc'`)
   - 이슈가 발견되면 즉시 Auto-fix를 진행하고 사유를 유저에게 보고합니다.

3. **실행 환경 및 렌더링 검증 (Runtime QA):**
   - 브라우저 서브에이전트 툴(Browser subagent)이 활용 가능한 상태라면, 로컬 호스트(`npm run dev`)를 띄운 뒤 실제로 해당 플로우를 클릭하며 버그나 레이아웃 깨짐을 찾고 수정합니다.
   - 불가능하다면, 유저에게 구체적인 테스트 스텝을 제공하여 UI 피드백을 요청합니다.

4. **최종 Ship 로그 생성 (Ship Log):**
   - 변경된 사항이 의도대로 동작함을 최종 선언하고 배포(Deployment) 혹은 다음 작업으로 넘어갈 준비가 되었음을 유저에게 알립니다.

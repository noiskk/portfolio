// 첫 화면 맨 위의 자기소개. 챗봇 모드/일반 모드 모두에서 같은 모습으로 쓴다.
// 연락처(GitHub, 메일)는 About me 섹션에 있다.
export default function IdentityHeader() {
  return (
    <div>
      <p className="text-blue-400 font-medium text-sm tracking-wide uppercase mb-3">
        Backend Developer
      </p>
      {/* 데스크톱에서는 한 줄. 좁은 화면에서는 text-wrap: balance로 자연스럽게 두 줄 */}
      <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-white mb-5 leading-tight">
        한 번 더 고민하는 개발자,{' '}
        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          김시온
        </span>
        입니다.
      </h1>
      {/* 문장 단위로 줄을 나눈다. 좁은 화면에서는 각 줄이 단어 단위로 자연스럽게 접힌다 */}
      <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
        <span className="block">좋은 코드는 좋은 설계에서 시작된다고 믿습니다.</span>
        <span className="block">
          유지보수와 확장성을 고려한 백엔드 설계부터 AWS 기반 인프라 구축까지, 서비스의 완성도를 높입니다.
        </span>
      </p>
    </div>
  );
}

# NR Battle Royale — Missão Segurança

Jogo educativo original para estudantes do Jovem Aprendiz, criado para a educadora Gilza Simão. O objetivo é identificar riscos e tomar decisões de prevenção em ambientes de trabalho.

## Jogar no navegador

Abra [NR Battle Royale](https://lucasmendoncam11-hash.github.io/lucas/). Todo o jogo está em [`index.html`](index.html): código, estilos e 30 missões incorporados em um único arquivo. Não precisa instalar nada. Use WASD ou as setas para mover e **E** para interagir. No celular, use os controles na tela.

O jogo inclui seis regiões (NR-17, NR-6, NR-11, NR-10, NR-12 e NR-1), 30 missões, três dificuldades, zona de risco, pontuação, ranking local e exportação CSV. O ranking fica apenas no navegador usado.

Para executar localmente, abra `index.html` no navegador. Como alternativa, execute `npm start` na pasta do projeto e abra `http://localhost:3000/`.

## Versão 3D para Windows

Baixe [NR Battle Royale para Windows](https://lucasmendoncam11-hash.github.io/lucas/downloads/NRBattleRoyale-Windows.zip), extraia o ZIP e execute `NRBattleRoyale.exe`. Mantenha `NRBattleRoyale.pck` na mesma pasta. O projeto Godot e as instruções de desenvolvimento estão em [`windows-game/`](windows-game/README.md).

A versão 3D é um **protótipo compacto** com arena, seis estações, movimento em terceira pessoa, zona de risco, decisões educativas e condições de vitória e derrota. Ela não tem o tamanho, o conteúdo ou a qualidade de produção de Fortnite. O ZIP contém os arquivos reais do jogo, sem preenchimento artificial.

## Outros projetos

O jogo anterior, Fuga Espacial, continua em [`game/`](game/). O aplicativo de tarefas Hoje está em [`tarefas.html`](tarefas.html).

## Verificação

`npm test` executa os testes da lógica de missões, progressão, vitória, derrota e dos projetos anteriores. As situações de segurança são material de apoio didático e devem ser revisadas pela educadora com as [Normas Regulamentadoras vigentes do MTE](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/ctpp-nrs/normas-regulamentadoras-nrs).

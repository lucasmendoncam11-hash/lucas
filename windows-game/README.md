# NR Battle Royale 3D — protótipo para Windows

Jogo original de prevenção de riscos em uma arena 3D. O agente explora seis estações inspiradas nas NRs 1, 6, 10, 11, 12 e 17, responde decisões de segurança e retorna ao portal central. A zona de risco avança durante a partida.

## Controles

- **WASD** ou setas: mover
- **E**: interagir com uma estação próxima
- **1 a 4**: escolher uma resposta
- **Esc**: pausar ou continuar
- **Enter**: iniciar ou reiniciar após o fim

## Executar o projeto

Requer Godot 4.6. Abra `project.godot` no editor e pressione F6/F5 ou execute:

```sh
godot --path windows-game
```

## Exportar para Windows

Instale os templates de exportação oficiais da mesma versão do Godot. No editor, use **Projeto → Exportar → Windows Desktop → Exportar projeto**. O preset está em `export_presets.cfg`. O arquivo `.exe` é um protótipo compacto: aumentar seu tamanho artificialmente não acrescentaria qualidade gráfica ou conteúdo.

Este jogo ensina decisões gerais de prevenção e não substitui treinamento supervisionado nem a consulta às Normas Regulamentadoras vigentes.

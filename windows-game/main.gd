extends Node3D

const ARENA_SIZE := 46.0
const ROUND_SECONDS := 210.0
const PLAYER_SPEED := 9.0
const INTERACT_DISTANCE := 4.2

const MISSIONS := [
	{"nr":"NR-17", "name":"ERGONOMIA", "question":"Uma pessoa torce o pescoço para enxergar a tela durante todo o turno. Qual atitude ajuda a prevenir o problema?", "choices":["Solicitar ajuste do posto e avaliação da atividade", "Ignorar o desconforto até o próximo mês", "Aumentar apenas o brilho da tela", "Trabalhar mais rápido na mesma posição"], "correct":0, "reason":"Adequar o posto e a organização da atividade ajuda a reduzir esforços desnecessários."},
	{"nr":"NR-6", "name":"PROTEÇÃO", "question":"Uma atividade expõe o rosto a partículas e a proteção disponível parece insuficiente. O que fazer?", "choices":["Continuar porque a tarefa é rápida", "Interromper a exposição e buscar a proteção adequada", "Pedir a um colega para assumir sem mudar as condições", "Virar o rosto durante a tarefa"], "correct":1, "reason":"A exposição deve ser controlada antes de retomar a atividade, com proteção adequada ao risco."},
	{"nr":"NR-11", "name":"DEPÓSITO", "question":"Caixas bloqueiam uma rota de circulação usada por pessoas e equipamentos. Qual medida é mais segura?", "choices":["Passar entre as caixas com cuidado", "Esperar que outra equipe resolva", "Desobstruir e organizar a rota antes da movimentação", "Aumentar a velocidade para liberar o local"], "correct":2, "reason":"Rotas desobstruídas e armazenamento organizado ajudam a prevenir colisões e quedas."},
	{"nr":"NR-10", "name":"ELETRICIDADE", "question":"Você encontra um painel elétrico danificado durante uma atividade. Como agir?", "choices":["Abrir o painel para observar melhor", "Tocar rapidamente para confirmar o defeito", "Cobrir o painel com uma caixa", "Afastar-se, sinalizar e acionar profissional autorizado"], "correct":3, "reason":"Não faça intervenção elétrica sem autorização e condições de segurança; comunique a situação."},
	{"nr":"NR-12", "name":"MÁQUINAS", "question":"Uma proteção de máquina foi removida e a operação está prestes a começar. O que decidir?", "choices":["Não iniciar; comunicar e providenciar a proteção antes de operar", "Operar lentamente e observar as partes móveis", "Pedir que um colega fique de vigia", "Usar luvas como substituto da proteção"], "correct":0, "reason":"A proteção da máquina deve estar presente e adequada antes da operação."},
	{"nr":"NR-1", "name":"GESTÃO", "question":"Um novo processo alterou os perigos do setor. Qual é a atitude preventiva?", "choices":["Manter os controles anteriores sem avaliação", "Identificar os novos perigos e revisar os riscos e controles", "Registrar apenas se ocorrer um acidente", "Deixar a avaliação para o fim do ano"], "correct":1, "reason":"Mudanças no trabalho exigem nova análise dos perigos e das medidas de prevenção."},
]

const COLORS := [
	Color("61d9e6"), Color("ffd25c"), Color("83e5a3"),
	Color("a9aaff"), Color("ff9186"), Color("dc9cff")
]

var player: Node3D
var camera: Camera3D
var zone_mesh: ImmediateMesh
var zone_instance: MeshInstance3D
var stations: Array[Node3D] = []
var station_lights: Array[OmniLight3D] = []
var hazards: Array[Node3D] = []
var blocks: Array[Dictionary] = []
var completed := [false, false, false, false, false, false]
var score := 0
var safety := 100.0
var time_left := ROUND_SECONDS
var zone_radius := 31.0
var damage_cooldown := 0.0
var mode := "menu"
var active_mission := -1
var hud: Label
var hint: Label
var overlay: ColorRect
var overlay_box: VBoxContainer
var overlay_title: Label
var overlay_text: Label


func _ready() -> void:
	build_world()
	build_ui()
	show_menu()


func mat(color: Color, glow: bool = false) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.metallic = 0.28
	material.roughness = 0.34
	if glow:
		material.emission_enabled = true
		material.emission = color
		material.emission_energy_multiplier = 1.8
	return material


func add_box(parent: Node3D, location: Vector3, size: Vector3, color: Color, glow: bool = false) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	instance.mesh = mesh
	instance.material_override = mat(color, glow)
	instance.position = location
	parent.add_child(instance)
	return instance


func add_cylinder(parent: Node3D, location: Vector3, radius: float, height: float, color: Color, glow: bool = false) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	instance.mesh = mesh
	instance.material_override = mat(color, glow)
	instance.position = location
	parent.add_child(instance)
	return instance


func add_sphere(parent: Node3D, location: Vector3, radius: float, color: Color, glow: bool = false) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	instance.mesh = mesh
	instance.material_override = mat(color, glow)
	instance.position = location
	parent.add_child(instance)
	return instance


func build_world() -> void:
	var environment := WorldEnvironment.new()
	var world := Environment.new()
	world.background_mode = Environment.BG_COLOR
	world.background_color = Color("0c1230")
	world.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	world.ambient_light_color = Color("a2bfff")
	world.ambient_light_energy = 0.48
	world.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.environment = world
	add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52, 34, 0)
	sun.light_color = Color("ffe3c8")
	sun.light_energy = 1.5
	sun.shadow_enabled = true
	add_child(sun)
	add_box(self, Vector3(0, -0.28, 0), Vector3(ARENA_SIZE, 0.55, ARENA_SIZE), Color("253863"))
	for line in range(-22, 23, 4):
		add_box(self, Vector3(line, 0.012, 0), Vector3(0.035, 0.025, 44), Color("385684"), true)
		add_box(self, Vector3(0, 0.012, line), Vector3(44, 0.025, 0.035), Color("385684"), true)
	for edge in [-1.0, 1.0]:
		add_box(self, Vector3(edge * 23, 0.75, 0), Vector3(0.5, 1.5, 46), Color("2a4a78"))
		add_box(self, Vector3(0, 0.75, edge * 23), Vector3(46, 1.5, 0.5), Color("2a4a78"))
	for index in range(6):
		var angle := TAU * float(index) / 6.0 - PI / 2.0
		var point := Vector3(cos(angle) * 14.0, 0.0, sin(angle) * 14.0)
		var station := Node3D.new()
		station.position = point
		station.name = MISSIONS[index].nr
		add_child(station)
		add_cylinder(station, Vector3(0, 0.16, 0), 2.25, 0.3, Color("1c315c"))
		add_cylinder(station, Vector3(0, 0.39, 0), 1.85, 0.13, COLORS[index], true)
		add_box(station, Vector3(0, 1.5, 0), Vector3(1.4, 2.2, 0.75), Color("29426a"))
		add_box(station, Vector3(0, 1.85, -0.42), Vector3(1.0, 0.7, 0.05), COLORS[index], true)
		add_cylinder(station, Vector3(0, 3.0, 0), 0.34, 0.1, COLORS[index], true)
		var label := Label3D.new()
		label.text = MISSIONS[index].nr + "\n" + MISSIONS[index].name
		label.font_size = 34
		label.pixel_size = 0.008
		label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		label.position = Vector3(0, 3.85, 0)
		label.modulate = Color.WHITE
		station.add_child(label)
		var station_light := OmniLight3D.new()
		station_light.position.y = 2.3
		station_light.light_color = COLORS[index]
		station_light.light_energy = 1.3
		station_light.omni_range = 6
		station.add_child(station_light)
		station_lights.append(station_light)
		stations.append(station)
	for i in range(8):
		var angle := TAU * float(i) / 8.0 + PI / 8.0
		var location := Vector3(cos(angle) * 9.0, 0, sin(angle) * 9.0)
		var block := Node3D.new()
		block.position = location
		add_child(block)
		add_box(block, Vector3(0, 0.8, 0), Vector3(2.2, 1.6, 2.2), Color("52648a"))
		add_box(block, Vector3(0, 1.65, 0), Vector3(2.4, 0.18, 2.4), Color("7a89b1"))
		blocks.append({"position": location, "radius": 1.7})
	var portal := Node3D.new()
	portal.name = "Portal de Saída"
	add_child(portal)
	add_cylinder(portal, Vector3(0, 0.15, 0), 3.2, 0.3, Color("4b3478"))
	add_cylinder(portal, Vector3(0, 0.36, 0), 2.55, 0.13, Color("a57df5"), true)
	add_cylinder(portal, Vector3(0, 0.48, 0), 1.95, 0.11, Color("83f6e2"), true)
	var portal_light := OmniLight3D.new()
	portal_light.position = Vector3(0, 2, 0)
	portal_light.light_color = Color("a591ff")
	portal_light.light_energy = 1.9
	portal_light.omni_range = 9
	portal.add_child(portal_light)
	for i in range(4):
		var hazard := Node3D.new()
		add_child(hazard)
		add_sphere(hazard, Vector3.ZERO, 0.67, Color("ff714e"), true)
		add_cylinder(hazard, Vector3(0, -0.56, 0), 0.9, 0.07, Color("ffb648"), true)
		hazards.append(hazard)
	zone_mesh = ImmediateMesh.new()
	zone_instance = MeshInstance3D.new()
	zone_instance.mesh = zone_mesh
	zone_instance.material_override = mat(Color("fd5eb2"), true)
	add_child(zone_instance)
	player = Node3D.new()
	player.position = Vector3(0, 0, 18)
	add_child(player)
	add_cylinder(player, Vector3(0, 0.85, 0), 0.55, 1.5, Color("55d5ef"))
	add_sphere(player, Vector3(0, 1.85, 0), 0.55, Color("ffdfbf"))
	add_box(player, Vector3(0, 1.88, -0.38), Vector3(0.82, 0.22, 0.2), Color("152b5b"), true)
	add_box(player, Vector3(0, 0.91, 0.55), Vector3(0.85, 0.85, 0.34), Color("ffe27b"))
	add_box(player, Vector3(-0.43, 0.12, -0.12), Vector3(0.36, 0.25, 0.7), Color("223c68"))
	add_box(player, Vector3(0.43, 0.12, -0.12), Vector3(0.36, 0.25, 0.7), Color("223c68"))
	camera = Camera3D.new()
	camera.current = true
	camera.fov = 55
	add_child(camera)
	camera.position = Vector3(0, 19, 34)
	camera.look_at(player.position + Vector3(0, 0.5, 0))
	draw_zone()


func build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var screen := Control.new()
	screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(screen)
	var top := PanelContainer.new()
	top.position = Vector2(20, 18)
	top.custom_minimum_size = Vector2(1240, 73)
	style_panel(top, Color("121f45dd"))
	screen.add_child(top)
	hud = Label.new()
	hud.add_theme_color_override("font_color", Color("ecfaff"))
	hud.add_theme_font_size_override("font_size", 23)
	hud.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hud.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top.add_child(hud)
	hint = Label.new()
	hint.position = Vector2(25, 656)
	hint.custom_minimum_size = Vector2(1220, 42)
	hint.add_theme_color_override("font_color", Color("d6e5ff"))
	hint.add_theme_font_size_override("font_size", 21)
	screen.add_child(hint)
	overlay = ColorRect.new()
	overlay.color = Color("090e2ac9")
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	screen.add_child(overlay)
	var panel := PanelContainer.new()
	panel.position = Vector2(345, 110)
	panel.custom_minimum_size = Vector2(590, 500)
	style_panel(panel, Color("202d61"))
	overlay.add_child(panel)
	overlay_box = VBoxContainer.new()
	overlay_box.add_theme_constant_override("separation", 12)
	panel.add_child(overlay_box)
	overlay_title = Label.new()
	overlay_title.add_theme_font_size_override("font_size", 33)
	overlay_title.add_theme_color_override("font_color", Color("76f4e7"))
	overlay_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	overlay_box.add_child(overlay_title)
	overlay_text = Label.new()
	overlay_text.add_theme_font_size_override("font_size", 19)
	overlay_text.add_theme_color_override("font_color", Color("f4f6ff"))
	overlay_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	overlay_text.custom_minimum_size = Vector2(550, 90)
	overlay_box.add_child(overlay_text)


func style_panel(panel: PanelContainer, color: Color) -> void:
	var box := StyleBoxFlat.new()
	box.bg_color = color
	box.border_color = Color("667fce")
	box.set_border_width_all(2)
	box.set_corner_radius_all(16)
	box.set_content_margin_all(18)
	panel.add_theme_stylebox_override("panel", box)


func clear_overlay_buttons() -> void:
	for child in overlay_box.get_children():
		if child != overlay_title and child != overlay_text:
			child.queue_free()


func add_overlay_button(label_text: String, callback: Callable) -> void:
	var button := Button.new()
	button.text = label_text
	button.custom_minimum_size = Vector2(0, 54)
	button.add_theme_font_size_override("font_size", 22)
	button.pressed.connect(callback)
	overlay_box.add_child(button)


func show_menu() -> void:
	mode = "menu"
	overlay.visible = true
	clear_overlay_buttons()
	overlay_title.text = "NR BATTLE ROYALE"
	overlay_text.text = "MISSÃO SEGURANÇA\n\nExplore seis estações, resolva decisões de prevenção e alcance o portal central antes que a zona de risco feche.\n\nWASD ou setas: mover  ·  E: interagir  ·  1 a 4: responder  ·  Esc: pausar"
	add_overlay_button("COMEÇAR MISSÃO", _start_game)
	hint.text = "Educadora Gilza Simão  ·  Conteúdo educativo para discussão em sala de aula"
	update_hud()


func _start_game() -> void:
	completed = [false, false, false, false, false, false]
	score = 0
	safety = 100.0
	time_left = ROUND_SECONDS
	zone_radius = 31.0
	damage_cooldown = 0.0
	active_mission = -1
	player.position = Vector3(0, 0, 18)
	for index in range(stations.size()):
		station_lights[index].light_color = COLORS[index]
		station_lights[index].light_energy = 1.3
	mode = "playing"
	overlay.visible = false
	hint.text = "Procure uma estação brilhante e pressione E para investigar. Complete as seis e volte ao portal central."
	update_hud()


func _process(delta: float) -> void:
	if mode != "playing":
		return
	var step: float = minf(delta, 0.05)
	time_left = max(0.0, time_left - step)
	zone_radius = lerp(31.0, 6.5, 1.0 - time_left / ROUND_SECONDS)
	if time_left <= 0.0:
		finish(false, "O tempo da missão terminou.")
		return
	var input := Vector2.ZERO
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT): input.x -= 1
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT): input.x += 1
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP): input.y -= 1
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN): input.y += 1
	input = input.normalized()
	var next: Vector3 = player.position + Vector3(input.x, 0, input.y) * PLAYER_SPEED * step
	next.x = clampf(next.x, -21.5, 21.5)
	next.z = clampf(next.z, -21.5, 21.5)
	if not blocked(next):
		player.position = next
	if input.length() > 0.01:
		player.rotation.y = lerp_angle(player.rotation.y, atan2(input.x, input.y), min(1.0, step * 12.0))
	camera.position = camera.position.lerp(player.position + Vector3(0, 19, 18), min(1.0, step * 3.0))
	camera.look_at(player.position + Vector3(0, 0.5, 0))
	for index in range(hazards.size()):
		var angle := Time.get_ticks_msec() / 1000.0 * (0.65 + index * 0.08) + index * TAU / hazards.size()
		hazards[index].position = Vector3(cos(angle) * (5.0 + index * 1.6), 1.0 + sin(angle * 3.0) * 0.2, sin(angle) * (5.0 + index * 1.6))
	damage_cooldown = max(0.0, damage_cooldown - step)
	var distance := Vector2(player.position.x, player.position.z).length()
	if distance > zone_radius:
		safety -= step * 7.0
		hint.text = "ZONA DE RISCO! Volte para a área segura."
	elif nearest_station() >= 0:
		hint.text = "Pressione E para investigar: " + MISSIONS[nearest_station()].nr
	elif completed.count(true) == MISSIONS.size() and distance < 3.2:
		hint.text = "Portal liberado! Pressione E para concluir a missão."
	else:
		hint.text = "Encontre as estações brilhantes. A zona rosa avança com o tempo."
	if damage_cooldown <= 0.0:
		for hazard in hazards:
			if player.position.distance_to(hazard.position) < 1.45:
				safety -= 8.0
				damage_cooldown = 1.3
				hint.text = "Você tocou em um risco móvel! Afaste-se."
				break
	if safety <= 0.0:
		finish(false, "A barra de segurança chegou a zero.")
		return
	draw_zone()
	update_hud()


func blocked(location: Vector3) -> bool:
	for block in blocks:
		if Vector2(location.x, location.z).distance_to(Vector2(block.position.x, block.position.z)) < block.radius + 0.55:
			return true
	return false


func draw_zone() -> void:
	zone_mesh.clear_surfaces()
	zone_mesh.surface_begin(Mesh.PRIMITIVE_LINES)
	for i in range(96):
		var a := TAU * float(i) / 96.0
		var b := TAU * float(i + 1) / 96.0
		zone_mesh.surface_add_vertex(Vector3(cos(a) * zone_radius, 0.07, sin(a) * zone_radius))
		zone_mesh.surface_add_vertex(Vector3(cos(b) * zone_radius, 0.07, sin(b) * zone_radius))
	zone_mesh.surface_end()


func nearest_station() -> int:
	var nearest := -1
	var best := INTERACT_DISTANCE
	for index in range(stations.size()):
		if completed[index]:
			continue
		var distance := player.position.distance_to(stations[index].position)
		if distance < best:
			best = distance
			nearest = index
	return nearest


func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	if event.keycode == KEY_ESCAPE:
		if mode == "playing": show_pause()
		elif mode == "pause": resume()
		return
	if event.keycode == KEY_ENTER and (mode == "menu" or mode == "win" or mode == "lose"):
		_start_game()
		return
	if mode == "playing" and event.keycode == KEY_E:
		interact()
	elif mode == "question" and event.keycode >= KEY_1 and event.keycode <= KEY_4:
		_choose_answer(event.keycode - KEY_1)


func interact() -> void:
	if completed.count(true) == MISSIONS.size() and Vector2(player.position.x, player.position.z).length() < 3.2:
		finish(true, "Você concluiu as seis estações e protegeu a equipe!")
		return
	var index := nearest_station()
	if index < 0:
		hint.text = "Chegue mais perto de uma estação para interagir."
		return
	active_mission = index
	show_question(index)


func show_question(index: int) -> void:
	mode = "question"
	overlay.visible = true
	clear_overlay_buttons()
	overlay_title.text = MISSIONS[index].nr + "  ·  " + MISSIONS[index].name
	overlay_text.text = MISSIONS[index].question
	for choice in range(4):
		add_overlay_button(str(choice + 1) + ". " + MISSIONS[index].choices[choice], _choose_answer.bind(choice))


func _choose_answer(choice: int) -> void:
	if mode != "question" or active_mission < 0:
		return
	var mission: Dictionary = MISSIONS[active_mission]
	clear_overlay_buttons()
	if choice == mission.correct:
		completed[active_mission] = true
		score += 350
		station_lights[active_mission].light_color = Color("69ffae")
		station_lights[active_mission].light_energy = 0.55
		overlay_title.text = "RISCO CONTROLADO  +350"
		overlay_text.text = mission.reason + "\n\nEsta estação foi concluída."
	else:
		safety -= 12.0
		overlay_title.text = "REVEJA A DECISÃO  −12 SEGURANÇA"
		overlay_text.text = mission.reason + "\n\nTente novamente antes de prosseguir."
	if safety <= 0.0:
		finish(false, "A barra de segurança chegou a zero.")
		return
	add_overlay_button("CONTINUAR", _continue_after_answer.bind(choice == mission.correct))
	update_hud()


func _continue_after_answer(was_correct: bool) -> void:
	if was_correct:
		active_mission = -1
		resume()
	else:
		show_question(active_mission)


func update_hud() -> void:
	if hud == null:
		return
	hud.text = "NR BATTLE ROYALE   ✦   RISCOS CONTROLADOS  %d / 6     ◆   PONTOS  %d     ♥   SEGURANÇA  %d%%     ◷   TEMPO  %02d:%02d" % [completed.count(true), score, maxi(0, int(safety)), int(time_left) / 60, int(time_left) % 60]


func show_pause() -> void:
	mode = "pause"
	overlay.visible = true
	clear_overlay_buttons()
	overlay_title.text = "MISSÃO PAUSADA"
	overlay_text.text = "Respire. A prevenção começa com atenção.\n\nVolte para concluir as seis estações antes do fim do tempo."
	add_overlay_button("CONTINUAR", resume)
	add_overlay_button("RECOMEÇAR", _start_game)


func resume() -> void:
	mode = "playing"
	overlay.visible = false


func finish(victory: bool, reason: String) -> void:
	mode = "win" if victory else "lose"
	overlay.visible = true
	clear_overlay_buttons()
	overlay_title.text = "VITÓRIA — SEGURANÇA EM PRIMEIRO LUGAR!" if victory else "MISSÃO ENCERRADA"
	overlay_text.text = reason + "\n\nRiscos controlados: %d / 6\nPontuação: %d\nTempo restante: %d segundos" % [completed.count(true), score, int(time_left)]
	add_overlay_button("JOGAR NOVAMENTE", _start_game)
	add_overlay_button("MENU PRINCIPAL", show_menu)

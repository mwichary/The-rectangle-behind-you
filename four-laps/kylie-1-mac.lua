-- This is a script for Four Laps
-- More information: https://medium.com/p/e20dd59271af/
-- Marcin Wichary, 2021

--  This was loaded on the first, Mac computer


-- VARIABLES
-----------------------------------------------------------------------------

obs = obslua

recording_filename = ""
recording_filename_1 = ""
recording_filename_2 = ""
recording_filename_3 = ""
recording_filename_4 = ""

launched = false


-- BASIC SCRIPT STUFF
-----------------------------------------------------------------------------

function script_description()
	return "Four Laps 1st computer"
end

function script_update(settings)
end


-- HELPER FUNCTIONS
-----------------------------------------------------------------------------

function file_exists(name)
  local f = io.open(name, "r")
  if f ~= nil then 
    io.close(f) 
    return true 
  end
  return false 
end

local function log(name, msg)
  if msg ~= nil then
    msg = " > " .. tostring(msg)
  else
    msg = ""
  end
  obs.script_log(obs.LOG_DEBUG, name .. msg)
end


-- IMPORTANT FUNCTIONS
-----------------------------------------------------------------------------

function stop_output()
  obs.timer_remove(stop_output) -- Only fire this timer once
  log('stop output')
    
  obs.obs_frontend_recording_stop()
end


function add_looped_recording() 
  obs.timer_remove(add_looped_recording) -- Only first this timer once each time

  local current_scene = obs.obs_frontend_get_current_scene()
  local current_source = obs.obs_scene_from_source(current_scene)

  local recording_settings = obs.obs_data_create()
  obs.obs_data_set_string(recording_settings, "local_file", recording_filename)
  obs.obs_data_set_bool(recording_settings, "looping", false)
  obs.obs_data_set_bool(recording_settings, "is_local_file", true)
  local recording = obs.obs_source_create_private("ffmpeg_source", "Recording", recording_settings)
  local item = obs.obs_scene_add(current_source, recording)
  obs.obs_data_release(recording_settings)
  obs.obs_sceneitem_set_order(item, obs.OBS_ORDER_MOVE_DOWN)
  obs.obs_sceneitem_set_locked(item, true) -- This prevents the selected red border appearing around the item

  local recording_filter_settings_2 = obs.obs_data_create()
  obs.obs_data_set_double(recording_filter_settings_2, "db", -30.0)
  local recording_filter_2 = obs.obs_source_create_private("gain_filter", "Mute", recording_filter_settings_2)
  obs.obs_source_filter_add(recording, recording_filter_2)
  obs.obs_data_release(recording_filter_settings_2)
  obs.obs_source_release(recording_filter_2)

  obs.obs_source_release(recording)
  obs.obs_scene_release(current_source)
  obs.obs_source_release(current_scene)
end

function record_filename_2() 
  obs.timer_remove(record_filename_2) -- Only fire this timer once
  recording_filename_2 = "/Users/marcinwichary/Movies/" .. string.gsub(os.date("%Y-%m-%d_%X"), "(:)", "-") .. ".mkv"
end

function record_filename_3() 
  obs.timer_remove(record_filename_3) -- Only fire this timer once
  recording_filename_3 = "/Users/marcinwichary/Movies/" .. string.gsub(os.date("%Y-%m-%d_%X"), "(:)", "-") .. ".mkv"
end

function record_filename_4() 
  obs.timer_remove(record_filename_4) -- Only fire this timer once
  recording_filename_4 = "/Users/marcinwichary/Movies/" .. string.gsub(os.date("%Y-%m-%d_%X"), "(:)", "-") .. ".mkv"
end

function find_filename()
  obs.timer_remove(find_filename) -- Only fire this timer once
  if file_exists(recording_filename_1) then
    log('filename 1!')
    recording_filename = recording_filename_1
  elseif file_exists(recording_filename_2) then
    log('filename 2!')
    recording_filename = recording_filename_2
  elseif file_exists(recording_filename_3) then
    log('filename 3!')
    recording_filename = recording_filename_3
  elseif file_exists(recording_filename_4) then
    log('filename 4!')
    recording_filename = recording_filename_4
  end

  log('filename:' .. recording_filename)
end


-- MAIN FUNCTION THAT GETS CALLED WHEN I PRESS THE REMOTE
-----------------------------------------------------------------------------

function kylie(pressed)
  -- You normally get two events; ignoring the second one
  if not pressed then
    return
  end

  -- This prevents accidentally activating twice
  if launched then
    log('Prevented from firing again!')
    return
  end

  launched = true
  
  -- Connect to the server to tell other computers it’s time to go.
  -- Note this is UI/process blocking, but it doesn’t matter here

  local url = "https://aresluna.org/kylie/save.php"
  local status = os.execute("curl --connect-timeout 1 --max-time 1 '" .. url .. "'  2>&1 &" )

  ---------------------------------------------------------------------------
  
  current_scene = obs.obs_frontend_get_current_scene()
  current_source = obs.obs_scene_from_source(current_scene)
  obs.obs_source_release(current_scene)

  -- This removes all the old items that might be in the scene.
  -- This is technically unnecessary in my case since I have a script that always restarts OBS to a pre-defined state,
  -- but leaving here just in case.
  local sceneitems = obs.obs_scene_enum_items(current_source)
  for i, sceneitem in ipairs(sceneitems) do
    local sourceSrc = obs.obs_sceneitem_get_source(sceneitem)
    local type = obs.obs_source_get_id(sourceSrc)
    local settings = obs.obs_source_get_settings(sourceSrc)
    obs.obs_sceneitem_remove(sceneitem)
  end

  -- Add a background at the very bottom

  local color_settings = obs.obs_data_create()
  obs.obs_data_set_int(color_settings, "width", 1920)
  obs.obs_data_set_int(color_settings, "height", 1080)
  obs.obs_data_set_int(color_settings, "color", 0xffffffff)
  local color_source = obs.obs_source_create("color_source", "Color", color_settings, nil)
  local color_item = obs.obs_scene_add(current_source, color_source)
  obs.obs_sceneitem_set_order(color_item, obs.OBS_ORDER_MOVE_BOTTOM)
  obs.obs_data_release(color_settings)
  obs.obs_sceneitem_set_locked(color_item, true) -- This prevents the selected red border appearing around the item


  -- Add a Cam Link capture from my camera

  local camera_settings = obs.obs_data_create()
  obs.obs_data_set_string(camera_settings, "device", "0x1100000fd90066") -- system id 
  obs.obs_data_set_string(camera_settings, "preset", "AVCaptureSessionPresetHigh") -- This means 1920x1080
  local camera = obs.obs_source_create("av_capture_input", "Camera video", camera_settings, nil)
  local item = obs.obs_scene_add(current_source, camera)
  obs.obs_data_release(camera_settings)
  obs.obs_sceneitem_set_locked(item, true) -- This prevents the selected red border appearing around the item

  -- Add three filters to the camera
  -- 1. (top) apply LUT
  -- 2. Color Correction – increase contrast and brightness so the white in the background is really white
  -- 3. (bottom) Color Key – us it to make the white transparent

  local lut_filter_settings = obs.obs_data_create()
  obs.obs_data_set_string(lut_filter_settings, "image_path", "LUT.cube") 
  obs.obs_data_set_double(lut_filter_settings, "clut_amount", 1.0)
  local _clut_filter = obs.obs_source_create_private("clut_filter", "LUT", lut_filter_settings)
  obs.obs_source_filter_add(camera, _clut_filter)
  obs.obs_data_release(lut_filter_settings)
  obs.obs_source_release(_clut_filter)

  local filter_settings = obs.obs_data_create()
  obs.obs_data_set_double(filter_settings, "contrast", 0.3) 
  obs.obs_data_set_double(filter_settings, "brightness", 0.10)
  local _color_filter = obs.obs_source_create_private("color_filter", "Camera Filter", filter_settings)
  obs.obs_source_filter_add(camera, _color_filter)
  obs.obs_data_release(filter_settings)
  obs.obs_source_release(_color_filter)

  local recording_filter_settings = obs.obs_data_create()
  obs.obs_data_set_int(recording_filter_settings, "key_color", 0xffffffff)
  obs.obs_data_set_string(recording_filter_settings, "key_color_type", "custom")
  obs.obs_data_set_int(recording_filter_settings, "similarity", 57)
  obs.obs_data_set_int(recording_filter_settings, "smoothness", 94)
  local recording_filter = obs.obs_source_create_private("color_key_filter", "Recording Filter", recording_filter_settings)
  obs.obs_source_filter_add(camera, recording_filter)
  obs.obs_data_release(recording_filter_settings)
  obs.obs_source_release(recording_filter)

  -- Start recording, and also figure out the filename of the recording in progress.
  --
  -- Note: This is a really stupid way of doing it. Instead of checking the directory for the newest file,
  -- this basically constructs the file name from the current system time. However, sometimes you can be
  -- off by a second, so you have to do it a few times… and then check which of the filenames are actually
  -- valid

  obs.obs_frontend_recording_stop()
  recording_filename_1 = "/Users/marcinwichary/Movies/" .. string.gsub(os.date("%Y-%m-%d_%X"), "(:)", "-") .. ".mkv"
  obs.obs_frontend_recording_start()
  obs.timer_add(record_filename_2, 500)
  obs.timer_add(record_filename_3, 500)
  obs.timer_add(record_filename_4, 500)
    obs.timer_add(find_filename, 2000)

  -- Some remnant clean up. It probably doesn’t matter
  if current_source then
    obs.obs_scene_release(current_source)
  end
  obs.obs_source_release(camera)

  -- Loop onto yourself after 70 seconds – also removes 200ms for empirically tested latency
  obs.timer_add(add_looped_recording, 70000 - 200) 

  -- Stop the entire recording after 7 minutes. It doesn’t really matter, since I would’ve quit OBS at that point anyway.
  obs.timer_add(stop_output, 60000 * 7)
end


-- REGISTER/UNREGISTER KEYBOARD SHORTCUT
-----------------------------------------------------------------------------

-- This script does little on load. Conceivably, a lot more from kylie() could be happening here instead
function script_load(settings) 
  -- This registers a shortcut slot that you can tie to a particular key by going to Settings > Hotkeys
  -- This one will be bound to right arrow, so it can be activated using my presentation remote
  hotkey_id = obs.obs_hotkey_register_frontend("kylie.trigger", "Kylie", kylie)
	local hotkey_save_array = obs.obs_data_get_array(settings, "kylie.trigger")
	obs.obs_hotkey_load(hotkey_id, hotkey_save_array)
	obs.obs_data_array_release(hotkey_save_array)
end

-- I am not sure what this does
function script_save(settings)
	local hotkey_save_array = obs.obs_hotkey_save(hotkey_id)
	obs.obs_data_set_array(settings, "kylie.trigger", hotkey_save_array)
	obs.obs_data_array_release(hotkey_save_array)
end

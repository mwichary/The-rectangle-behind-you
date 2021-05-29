-- This is a script for Four Laps
-- More information: https://medium.com/p/e20dd59271af/
-- Marcin Wichary, 2021

--  This was loaded on the second, Windows computer

-- VARIABLES
-----------------------------------------------------------------------------

local obs = obslua

last_server_number = 0

fadeout_scene = nil


-- C LINKAGE NECESSARY FOR ONE FUNCTION
-----------------------------------------------------------------------------

local ffi = require 'ffi'
local obsffi
if ffi.os == "OSX" then
  obsffi = ffi.load("obs.0.dylib")
else
  obsffi = ffi.load("obs")
end

ffi.cdef[[
typedef struct obs_hotkey obs_hotkey_t;
typedef size_t obs_hotkey_id;

const char *obs_hotkey_get_name(const obs_hotkey_t *key);
typedef bool (*obs_hotkey_enum_func)(void *data, obs_hotkey_id id, obs_hotkey_t *key);
void obs_enum_hotkeys(obs_hotkey_enum_func func, void *data);
]]


-- BASIC SCRIPT STUFF
-----------------------------------------------------------------------------

function script_description()
	return "Four Laps 2nd computer"
end

function script_update(settings)
	-- pause_scene = obs.obs_data_get_string(settings, "pause_scene")
end


-- HELPER FUNCTIONS
-----------------------------------------------------------------------------

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
  obs.obs_frontend_recording_stop()
end


-- This starts a virtual camera. This is done in a weird way that I found somewhere, since a
-- “native” function doesn’t exist
function start_virtual_cam()
  local target = 'OBSBasic.StartVirtualCam'
  local htk_id

  function callback_htk(data, id, key)
    local name = obsffi.obs_hotkey_get_name(key)
    if ffi.string(name) == target then
      htk_id = tonumber(id)
      return false
    else
      return true
    end
  end
  
  local cb = ffi.cast("obs_hotkey_enum_func", callback_htk)
  obsffi.obs_enum_hotkeys(cb, data)
  if htk_id then
    obs.obs_hotkey_trigger_routed_callback(htk_id, false)
    obs.obs_hotkey_trigger_routed_callback(htk_id, true)
    obs.obs_hotkey_trigger_routed_callback(htk_id, false)
  end
end

function find_source_by_name_in_list(source_list, name)
  for i, source in pairs(source_list) do
    source_name = obs.obs_source_get_name(source)
    if source_name == name then
      return source
    end
  end

  return nil
end

-- Starts a crossfade to a prepared empty white scene (so, effectively fadeout to white)
function start_fadeout()
  obs.timer_remove(start_fadeout) -- Only fire this timer once

  local new_something = obs.obs_scene_get_source(fadeout_scene)

  local transitions = obs.obs_frontend_get_transitions()
  local fade = find_source_by_name_in_list(transitions, "Fade")

  obs.obs_frontend_set_current_transition(fade)
  obs.obs_transition_start(fade, obs.OBS_TRANSITION_MODE_AUTO, 2000, new_something)
end


-- MAIN FUNCTION THAT GETS CALLED WHEN I PRESS THE REMOTE ON THE OTHER COMPUTER
-- AND THIS ONE KNOWS IT VIA THE SERVER
-----------------------------------------------------------------------------

function kylie(pressed)
  -- You normally get two events; ignoring the second one
  if not pressed then
    return
  end
    
  -- This creates an entirely new scene that’s just white
  -- We use this to fadeout at the end
  
  fadeout_scene = obs.obs_scene_create('Fadeout')
  local new_something = obs.obs_scene_get_source(fadeout_scene)
  local new_source = obs.obs_scene_from_source(new_something)

  local color_settings = obs.obs_data_create()
  obs.obs_data_set_int(color_settings, "width", 1920)
  obs.obs_data_set_int(color_settings, "height", 1080)
  obs.obs_data_set_int(color_settings, "color", 0xffffffff) -- White
  local color_source = obs.obs_source_create("color_source", "Color", color_settings, nil)
  local color_item = obs.obs_scene_add(new_source, color_source)
  obs.obs_sceneitem_set_locked(color_item, true) -- This prevents the selected red border appearing around the item
  obs.obs_data_release(color_settings)

  -- This starts a fadeout at 5:25
  obs.timer_add(start_fadeout, (5 * 60 + 25) * 1000)


  ---------------------------------------------------------------------------
  -- Now, we add objects to the current scene

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

  -- This adds a pre-recorded After Effects “slide deck”

  local recording_settings = obs.obs_data_create()
  obs.obs_data_set_string(recording_settings, "local_file", "C:/Users/mwich/Desktop/kylie/after-effects.ts")
  obs.obs_data_set_bool(recording_settings, "looping", false)
  local recording = obs.obs_source_create("ffmpeg_source", "AE", recording_settings, nil)
  local item = obs.obs_scene_add(current_source, recording)
  obs.obs_sceneitem_set_locked(item, true)  -- This prevents the selected red border appearing around the item
  obs.obs_data_release(recording_settings)

  -- This adds a Cam Link capture, which is the real-time looping video from the first
  -- computer

  local camera_settings = obs.obs_data_create()
  obs.obs_data_set_string(camera_settings, "video_device_id", "Cam Link 4K:\\\\?\\usb#22vid_0fd9&pid_0066&mi_00#227&71832f1&0&0000#22{65e8773d-8f56-11d0-a3b9-00a0c9223196}\\global")
  local camera = obs.obs_source_create("dshow_input", "Camera video", camera_settings, nil)
  local item2 = obs.obs_scene_add(current_source, camera)

  -- Move it down by 100px
  local pos = obs.vec2()
  pos.x = 0
  pos.y = 100
  obs.obs_sceneitem_set_pos(item2, pos)

  obs.obs_sceneitem_set_order(item2, obs.OBS_ORDER_MOVE_TOP)
  obs.obs_sceneitem_set_locked(item2, true)  -- This prevents the selected red border appearing around the item
  obs.obs_data_release(camera_settings)

  -- Add a key color filter
  local recording_filter_settings = obs.obs_data_create()
  obs.obs_data_set_int(recording_filter_settings, "key_color", 0xffffffff) -- White
  obs.obs_data_set_string(recording_filter_settings, "key_color_type", "custom")
  obs.obs_data_set_int(recording_filter_settings, "similarity", 67)
  obs.obs_data_set_int(recording_filter_settings, "smoothness", 94)
  local recording_filter = obs.obs_source_create_private("color_key_filter", "AE Filter", recording_filter_settings)
  obs.obs_source_filter_add(camera, recording_filter)
  obs.obs_data_release(recording_filter_settings)
  obs.obs_source_release(recording_filter)

  obs.obs_frontend_recording_stop()
  obs.obs_frontend_recording_start()

  -- Some remnant clean up. It probably doesn’t matter
  if current_source then
    obs.obs_scene_release(current_source)
  end
  obs.obs_source_release(camera)

  -- Stop the entire recording after 7 minutes. It doesn’t really matter, since I would’ve quit OBS at that point anyway.
  obs.timer_add(stop_output, 60000 * 7) -- 7 minutes
end


-- This checks the server to see whether the script
function check_server()
  local handle = io.open("c:\\Users\\mwich\\Desktop\\kylie\\data.txt", "r")
  local result = handle:read("*a")
  handle:close()

  if result == last_server_number then
  else
    if result then
      obs.timer_remove(check_server) -- Stop checking, we’re good to go
      kylie(true)
    end
  end
end


-- AUDIO STUFF
-----------------------------------------------------------------------------

function set_monitoring(cd, enable)
  local source = obs.calldata_source(cd, "source")
  if source ~= nil then
    local source_id = obs.obs_source_get_unversioned_id(source)

    -- Change the After Effects video so that it actually plays the sound on the speakers. The speakers
    -- will be muted, but this allows the sound to also make it to Zoom (the microphone will be piped
    -- separately)
    if (source_id == 'ffmpeg_source') then
      if enable then
        obs.obs_source_set_monitoring_type(source, 2) -- OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT
      else 
        obs.obs_source_set_monitoring_type(source, 0) -- OBS_MONITORING_TYPE_NONE
      end
    end
  
    -- I don’t think the below are necessary at all, they might be leftovers from testing

    if (source_id == 'scene') then
      obs.obs_source_set_monitoring_type(source, 0) -- OBS_MONITORING_TYPE_NONE
    end
  
    if (source_id == 'wasapi_input_capture') then
      obs.obs_source_set_monitoring_type(source, 0) -- OBS_MONITORING_TYPE_NONE
    end
  end
end


function source_activated(cd)
  set_monitoring(cd, true)
end

function source_deactivated(cd) 
  set_monitoring(cd, false)
end


-- STARTUP
-----------------------------------------------------------------------------

-- This script does more on load
function script_load(settings)
  
  -- Remove all the things from the current scene
  current_scene = obs.obs_frontend_get_current_scene()
  current_source = obs.obs_scene_from_source(current_scene)
  obs.obs_source_release(current_scene)

  local sceneitems = obs.obs_scene_enum_items(current_source)
  for i, sceneitem in ipairs(sceneitems) do
    local sourceSrc = obs.obs_sceneitem_get_source(sceneitem)
    local type = obs.obs_source_get_id(sourceSrc)
    local settings = obs.obs_source_get_settings(sourceSrc)
    obs.obs_sceneitem_remove(sceneitem)
  end  

  -- A separate Node script pings the server and writes its timestamp to this file.
  -- (This is a pretty lame way of doing this.)
  -- Here, we read the initial number. Now, whenever that number increases, it means
  -- I pressed the remote button on the other computer
  local handle = io.open("c:\\Users\\mwich\\Desktop\\kylie\\data.txt", "r")
  local result = handle:read("*a")
  handle:close()
  last_server_number = result

  -- Check the timestamp every 500ms
  obs.timer_add(check_server, 500)

  -- This registers a shortcut slot that you can tie to a particular key by going to Settings > Hotkeys
  -- I think I only used it for testing
  hotkey_id = obs.obs_hotkey_register_frontend("kylie.trigger", "Kylie", kylie)
	local hotkey_save_array = obs.obs_data_get_array(settings, "kylie.trigger")
	obs.obs_hotkey_load(hotkey_id, hotkey_save_array)
	obs.obs_data_array_release(hotkey_save_array)

  -- This starts the virtual camera immediately. Has a nice benefit of removing the OBS 
  -- “no virtual camera” image
  start_virtual_cam()

  -- Necessary for audio monitoring/output changes
  local sh = obs.obs_get_signal_handler()
  obs.signal_handler_connect(sh, "source_activate", source_activated)
  obs.signal_handler_connect(sh, "source_deactivate", source_deactivated)
end

-- I am not sure what this does
function script_save(settings)
	local hotkey_save_array = obs.obs_hotkey_save(hotkey_id)
	obs.obs_data_set_array(settings, "kylie.trigger", hotkey_save_array)
	obs.obs_data_array_release(hotkey_save_array)
end

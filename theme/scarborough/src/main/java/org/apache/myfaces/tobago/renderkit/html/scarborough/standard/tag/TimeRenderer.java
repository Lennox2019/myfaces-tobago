package org.apache.myfaces.tobago.renderkit.html.scarborough.standard.tag;

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Created 07.02.2003 16:00:00.
 * $Id: InRenderer.java 1361 2005-08-15 11:46:20 +0200 (Mon, 15 Aug 2005) lofwyr $
 */

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import static org.apache.myfaces.tobago.TobagoConstants.ATTR_CALENDAR_DATE_INPUT_ID;
import static org.apache.myfaces.tobago.TobagoConstants.ATTR_DISABLED;
import static org.apache.myfaces.tobago.TobagoConstants.ATTR_POPUP_CALENDAR_FORCE_TIME;
import static org.apache.myfaces.tobago.TobagoConstants.SUBCOMPONENT_SEP;
import org.apache.myfaces.tobago.component.ComponentUtil;
import org.apache.myfaces.tobago.component.UIPage;
import org.apache.myfaces.tobago.component.UITimeInput;
import org.apache.myfaces.tobago.context.ResourceManagerUtil;
import org.apache.myfaces.tobago.renderkit.InputRendererBase;
import org.apache.myfaces.tobago.renderkit.html.HtmlAttributes;
import org.apache.myfaces.tobago.renderkit.html.HtmlConstants;
import org.apache.myfaces.tobago.renderkit.html.HtmlRendererUtil;
import org.apache.myfaces.tobago.util.DateFormatUtils;
import org.apache.myfaces.tobago.webapp.TobagoResponseWriter;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.DateTimeConverter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;

public class TimeRenderer extends InputRendererBase {

  private static final Log LOG = LogFactory.getLog(TimeRenderer.class);

  private static final String[] SCRIPTS = {
        "script/calendar.js",
        "script/dateConverter.js"
    };

  public void encodeEnd(FacesContext facesContext, UIComponent component) throws IOException {
    if (!(component instanceof UITimeInput)) {
      LOG.error("Wrong type: Need " + UITimeInput.class.getName() + ", but was " + component.getClass().getName());
      return;
    }

    UIPage page = ComponentUtil.findPage(facesContext, component);
    page.getScriptFiles().addAll(Arrays.asList(SCRIPTS));
    UITimeInput input = (UITimeInput) component;

    // TODO title??
    /*
    Iterator messages = facesContext.getMessages(
        input.getClientId(facesContext));
    StringBuilder stringBuffer = new StringBuilder();
    while (messages.hasNext()) {
      FacesMessage message = (FacesMessage) messages.next();
      stringBuffer.append(message.getDetail());
    }

    String title = null;
    if (stringBuffer.length() > 0) {
      title = stringBuffer.toString();
    }

    title =
        HtmlRendererUtil.addTip(title, (String) input.getAttributes().get(ATTR_TIP));*/

    String currentValue = getCurrentValue(facesContext, input);
    if (LOG.isDebugEnabled()) {
      LOG.debug("currentValue = '" + currentValue + "'");
    }


    String converterPattern = "HH:mm";
    if (input.getConverter() != null) {
      Converter converter = input.getConverter();
      if (converter instanceof DateTimeConverter) {
        String pattern = DateFormatUtils.findPattern((DateTimeConverter) converter);
        if (pattern != null && pattern.indexOf('s') > -1) {
          converterPattern += ":ss";
        }
      }
    } else if (ComponentUtil.getBooleanAttribute(input, ATTR_POPUP_CALENDAR_FORCE_TIME)) {
      converterPattern += ":ss";
    }

    boolean hasSeconds = converterPattern.indexOf('s') > -1;

    Object value = input.getValue();
    Date date;
    if (value instanceof Date) {
      date = (Date) value;
    } else if (value instanceof Calendar) {
      date = ((Calendar) value).getTime();
    } else {
      date = new Date();
    }

    String hour = new SimpleDateFormat("HH").format(date);
    String minute = new SimpleDateFormat("mm").format(date);
    String second = new SimpleDateFormat("ss").format(date);

    String id = input.getClientId(facesContext);
    final String idPrefix = id + SUBCOMPONENT_SEP;
    TobagoResponseWriter writer = HtmlRendererUtil.getTobagoResponseWriter(facesContext);
    writer.startElement(HtmlConstants.DIV, input);
    writer.writeClassAttribute();

    writer.startElement(HtmlConstants.DIV, input);
    writer.writeAttribute(HtmlAttributes.ID, idPrefix + "borderDiv", false);
    writer.writeClassAttribute("tobago-time-borderDiv"
        + (hasSeconds ? " tobago-time-borderDiv-seconds" : ""));

    Integer tabIndex = input.getTabIndex();
    writeInput(writer, idPrefix + "hour", tabIndex, hour, true);
    writeInputSeparator(writer, ":");
    writeInput(writer, idPrefix + "minute", tabIndex, minute, false);
    if (hasSeconds) {
      writeInputSeparator(writer, ":");
      writeInput(writer, idPrefix + "second", tabIndex, second, false);
    }

    writer.endElement(HtmlConstants.DIV);

    String imageId = idPrefix + "inc";
    String imageSrc = "image/timeIncrement.gif";
    HtmlRendererUtil.addImageSources(facesContext, writer, imageSrc, imageId);
    writer.startElement(HtmlConstants.IMG, null);
    writer.writeIdAttribute(imageId);
    writer.writeAttribute(HtmlAttributes.ONCLICK, "tbgIncTime(this)", false);
    writer.writeClassAttribute("tobago-time-inc-image"
        + (hasSeconds ? " tobago-time-image-seconds" : ""));
    writer.writeAttribute(HtmlAttributes.SRC, ResourceManagerUtil.getImageWithPath(facesContext, imageSrc), true);
    writer.writeAttribute(HtmlAttributes.ALT, "", false); // TODO: tip

    if (!ComponentUtil.getBooleanAttribute(input, ATTR_DISABLED)) {
      writer.writeAttribute(HtmlAttributes.ONMOUSEOVER,
          "Tobago.imageMouseover('" + imageId + "')", null);
      writer.writeAttribute(HtmlAttributes.ONMOUSEOUT,
          "Tobago.imageMouseout('" + imageId + "')", null);
    }
    writer.endElement(HtmlConstants.IMG);

    imageId = idPrefix + "dec";
    imageSrc = "image/timeDecrement.gif";
    HtmlRendererUtil.addImageSources(facesContext, writer, imageSrc, imageId);
    writer.startElement(HtmlConstants.IMG, null);
    writer.writeIdAttribute(imageId);
    writer.writeAttribute(HtmlAttributes.ONCLICK, "tbgDecTime(this)", false);
    writer.writeClassAttribute("tobago-time-dec-image"
        + (hasSeconds ? " tobago-time-image-seconds" : ""));
    writer.writeAttribute(HtmlAttributes.SRC, ResourceManagerUtil.getImageWithPath(facesContext, imageSrc), true);
    writer.writeAttribute(HtmlAttributes.ALT, "", false); // TODO: tip
    if (!ComponentUtil.getBooleanAttribute(input, ATTR_DISABLED)) {
      writer.writeAttribute(HtmlAttributes.ONMOUSEOVER,
          "Tobago.imageMouseover('" + imageId + "')", null);
      writer.writeAttribute(HtmlAttributes.ONMOUSEOUT,
          "Tobago.imageMouseout('" + imageId + "')", null);
    }
    writer.endElement(HtmlConstants.IMG);

    writer.startElement(HtmlConstants.INPUT, input);
    writer.writeAttribute(HtmlAttributes.TYPE, "hidden", false);
    writer.writeIdAttribute(id + ":converterPattern");
    writer.writeAttribute(HtmlAttributes.VALUE, converterPattern, true);
    writer.endElement(HtmlConstants.INPUT);

    writer.startElement(HtmlConstants.INPUT, input);
    writer.writeAttribute(HtmlAttributes.TYPE, "hidden", false);
    writer.writeIdAttribute(id);
    writer.writeNameAttribute(id);
    writer.writeAttribute(HtmlAttributes.VALUE, hour + ":" + minute + ":" + second, false);
    writer.endElement(HtmlConstants.INPUT);

    String dateTextBoxId = (String) input.getAttributes().get(ATTR_CALENDAR_DATE_INPUT_ID);

    if (dateTextBoxId != null) {
      String[] cmds = {"tbgInitTimeParse('" + id + "', '" + dateTextBoxId + "');"};
      HtmlRendererUtil.writeScriptLoader(facesContext, SCRIPTS, cmds);
    }

    writer.endElement(HtmlConstants.DIV);
  }

  private void writeInputSeparator(TobagoResponseWriter writer, String sep) throws IOException {
    writer.startElement(HtmlConstants.SPAN, null);
    writer.writeClassAttribute("tobago-time-sep");
    writer.writeText(sep);
    writer.endElement(HtmlConstants.SPAN);
  }

  private void writeInput(TobagoResponseWriter writer, String id, Integer tabIndex, String hour, boolean hourMode)
      throws IOException {
    writer.startElement(HtmlConstants.INPUT, null);
    writer.writeAttribute(HtmlAttributes.TYPE, "text", false);
    writer.writeIdAttribute(id);
    if (tabIndex != null) {
      writer.writeAttribute(HtmlAttributes.TABINDEX, tabIndex);
    }
    writer.writeClassAttribute("tobago-time-input");
    writer.writeAttribute(HtmlAttributes.ONFOCUS, "tbgTimerInputFocus(this, " + hourMode + ")", false);
    writer.writeAttribute(HtmlAttributes.ONBLUR, "tbgTimerInputBlur(this)", false);
    writer.writeAttribute(HtmlAttributes.ONKEYUP, "tbgTimerKeyUp(this, event)", false);
    writer.writeAttribute(HtmlAttributes.VALUE, hour, true);
    writer.endElement(HtmlConstants.INPUT);
  }
}
